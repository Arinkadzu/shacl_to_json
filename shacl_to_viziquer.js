// Import modules we need to work with files, parse RDF, and make HTTP requests
const fs = require('fs').promises; // For reading/writing files
const path = require('path'); // For handling file paths
const { Parser, Store } = require('n3'); // For parsing Turtle files
const axios = require('axios'); // For making HTTP requests to SPARQL endpoints

// Define common RDF namespace URLs as constants
const SHACL = 'http://www.w3.org/ns/shacl#'; // SHACL namespace
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'; // RDF namespace
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // RDF type property
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'; // RDFS namespace
const VOID = 'http://rdfs.org/ns/void#'; // VOID namespace for metadata
const TIMEOUT_MS = 300000; // 5-minute timeout for the whole process

// Read config.json file
// Returns the configuration as an object
const readConfig = async () => {
  try {
    const configPath = path.join(__dirname, 'config.json'); // Get path to config file
    return JSON.parse(await fs.readFile(configPath, 'utf8')); // Read and parse JSON
  } catch (error) {
    throw new Error(`Failed to read config file: ${error.message}`); // Handle errors
  }
};

// Read namespaces from a JSON file
// Takes the file path and returns the namespaces as an object
const readNamespaces = async (filePath) => {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')); // Read and parse JSON
  } catch (error) {
    throw new Error(`Failed to read namespaces file: ${error.message}`); // Handle errors
  }
};

// Parse a Turtle file and handle errors
// Takes the file path and returns an N3 store with parsed data
const parseTurtleFile = async (filePath) => {
  try {
    const turtleContent = await fs.readFile(filePath, 'utf8'); // Read Turtle file
    if (!turtleContent.trim()) {
      throw new Error('Turtle file is empty'); // Check if file is empty
    }
    // Clean up encoded IRIs (e.g., <%3C...%3E>) that might cause issues
    const cleanedContent = turtleContent.replace(/<%3C[^>]+%3E>/g, '');
    const parser = new Parser(); // Create a new N3 parser
    const store = new Store(); // Create a store to hold parsed data

    // Parse the content and return a promise
    return new Promise((resolve, reject) => {
      let lineNumber = 0; // Track the current line number
      const lines = cleanedContent.split('\n'); // Split content into lines

      parser.parse(cleanedContent, (error, quad, prefixes) => {
        lineNumber++; // Increment line number
        if (error) {
          // Log warning if a line has an error and continue parsing
          console.warn(`Skipped line ${lineNumber}: ${lines[lineNumber - 1]?.trim() || 'unknown'} - ${error.message}`);
          return; // Move to next piece of data
        }
        if (quad) {
          store.addQuad(quad); // Add parsed data to store
        } else {
          resolve(store); // Finish parsing and return store
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to parse Turtle file: ${error.message}`); // Handle errors
  }
};

// Get prefixes from SHACL data and namespaces, making sure names are valid
// Takes the store, namespaces, and schema; returns a list of prefix objects
const extractPrefixes = (store, namespaces, schema) => {
  let autoNsCounter = 1; // Counter for auto-generated prefixes
  const usedNamespaces = new Set(); // Track used namespaces
  const prefixMap = new Map(namespaces.Prefixes.map(({ prefix, namespace }) => [namespace, prefix])); // Map namespaces to prefixes

  // Function to collect namespaces from URIs
  const collectNamespaces = (uri) => {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const splitIndex = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/')); // Find namespace boundary
      if (splitIndex > 0) {
        const namespace = uri.substring(0, splitIndex + 1); // Extract namespace
        usedNamespaces.add(namespace); // Add to set
      }
    }
  };

  // Collect namespaces from schema classes, attributes, and associations
  schema.Classes.forEach(cls => {
    collectNamespaces(cls.fullName); // Class URI
    cls.SuperClasses.forEach(collectNamespaces); // Superclass URIs
    cls.properties?.forEach(prop => collectNamespaces(prop.fullName)); // Property URIs
  });
  schema.Attributes.forEach(attr => {
    collectNamespaces(attr.fullName); // Attribute URI
    collectNamespaces(attr.type); // Attribute type URI
    attr.SourceClasses.forEach(sc => collectNamespaces(sc.includes(':') ? sc.split(':')[1] : sc)); // Source class URIs
  });
  schema.Associations.forEach(assoc => {
    collectNamespaces(assoc.fullName); // Association URI
    assoc.SourceClasses.forEach(sc => collectNamespaces(sc.includes(':') ? sc.split(':')[1] : sc)); // Source class URIs
    assoc.ClassPairs?.forEach(pair => {
      collectNamespaces(pair.SourceClass.includes(':') ? pair.SourceClass.split(':')[1] : pair.SourceClass); // Source class
      collectNamespaces(pair.TargetClass.includes(':') ? pair.TargetClass.split(':')[1] : pair.TargetClass); // Target class
    });
  });

  // Create list of prefixes for used namespaces
  const prefixes = [];
  usedNamespaces.forEach(namespace => {
    let prefix = prefixMap.get(namespace); // Check if prefix exists
    if (!prefix) {
      prefix = `ns${autoNsCounter++}`; // Generate new prefix if needed
      prefixMap.set(namespace, prefix);
    }
    prefixes.push({ prefix, namespace }); // Add to list
  });

  return prefixes; // Return the prefix list
};

// Fetch entity count using SPARQL query
// Takes a URI, whether it’s a class, and the SPARQL endpoint; returns the count
const fetchEntityCount = async (uri, isClass, sparqlEndpoint) => {
  // Build SPARQL query based on whether it’s a class or property
  const query = isClass
    ? `PREFIX rdf: <${RDF}> SELECT (COUNT(?s) AS ?count) WHERE { ?s rdf:type <${uri}> . }`
    : `SELECT (COUNT(?s) AS ?count) WHERE { ?s <${uri}> ?o . }`;
  try {
    console.log(`Fetching entity count for ${uri}...`);
    const response = await axios.get(sparqlEndpoint, {
      params: { query, format: 'json' }, // Query parameters
      headers: { 'Accept': 'application/sparql-results+json' }, // Accept JSON results
      timeout: 10000 // 10-second timeout
    });
    const count = parseInt(response.data.results.bindings[0]?.count.value || 0); // Get count
    console.log(`Fetched count for ${uri}: ${count}`);
    return count; // Return count
  } catch (error) {
    console.warn(`Failed to fetch count for ${uri}: ${error.message}`); // Log error
    return 0; // Return 0 if query fails
  }
};

// Convert SHACL data to ViziQuer schema
// Takes the store, schema name, SPARQL endpoint, and namespaces; returns the schema
const convertToViziQuerSchema = async (store, schemaName, sparqlEndpoint, namespaces) => {
  console.log('Converting SHACL to ViziQuer schema...');
  const prefixMap = Object.fromEntries(namespaces.Prefixes.map(({ prefix, namespace }) => [prefix, namespace])); // Map prefixes to namespaces
  const schema = {
    SchemaName: schemaName, // Set schema name
    Classes: [], // List of classes
    Attributes: [], // List of attributes
    Associations: [], // List of associations
    Prefixes: [], // List of prefixes
    Parameters: [ // Default parameters for ViziQuer
      { name: 'endpointUrl', value: sparqlEndpoint },
      { name: 'graphName', value: schemaName },
      { name: 'calculateSubClassRelations', value: 'true' },
      { name: 'calculateDomainAndRangePairs', value: 'true' },
      { name: 'calculateDataTypes', value: 'true' },
      { name: 'calculateCardinalities', value: 'propertyLevelAndClassContext' },
      { name: 'minimalAnalyzedClassSize', value: '0' }
    ]
  };

  // Helper to split URI into prefix and local name
  const getLocalNameAndPrefix = (uri) => {
    for (const [prefix, ns] of Object.entries(prefixMap)) {
      if (uri.startsWith(ns)) {
        return { prefix, localName: uri.slice(ns.length) }; // Return prefix and local name
      }
    }
    return { prefix: null, localName: uri }; // Return URI as local name if no prefix
  };

  // Find all classes (NodeShapes)
  const classUris = new Set();
  store.forEach(quad => {
    if (quad.predicate.value === RDF_TYPE && quad.object.value === `${SHACL}NodeShape`) {
      classUris.add(quad.subject.value); // Add class URI
    }
  });

  // Process each class
  for (const classUri of classUris) {
    const { prefix, localName } = getLocalNameAndPrefix(classUri); // Get prefix and name
    const superClasses = []; // List of superclasses
    let instanceCount = 0; // Number of instances
    const properties = []; // List of properties

    // Get superclasses and instance count
    store.forEach(quad => {
      if (quad.subject.value === classUri) {
        if (quad.predicate.value === `${RDFS}subClassOf`) {
          superClasses.push(quad.object.value); // Add superclass
        } else if (quad.predicate.value === `${VOID}entities`) {
          instanceCount = parseInt(quad.object.value) || 0; // Get instance count
        }
      }
    });

    // Use SPARQL if no instance count found
    if (instanceCount === 0) {
      instanceCount = await fetchEntityCount(classUri, true, sparqlEndpoint);
    }

    // Get properties for the class
    const propertyShapes = [];
    store.forEach(quad => {
      if (quad.predicate.value === `${SHACL}property` && quad.subject.value === classUri) {
        propertyShapes.push(quad.object.value); // Add property shape
      }
    });

    // Process each property
    for (const propShape of propertyShapes) {
      let path, datatype, minCount, maxCount; // Property details
      store.forEach(quad => {
        if (quad.subject.value === propShape) {
          if (quad.predicate.value === `${SHACL}path`) path = quad.object.value; // Property path
          if (quad.predicate.value === `${SHACL}datatype`) datatype = quad.object.value; // Data type
          if (quad.predicate.value === `${SHACL}minCount`) minCount = parseInt(quad.object.value); // Min cardinality
          if (quad.predicate.value === `${SHACL}maxCount`) maxCount = parseInt(quad.object.value); // Max cardinality
        }
      });

      if (path) {
        const { prefix: propPrefix, localName: propLocalName } = getLocalNameAndPrefix(path);
        properties.push({
          localName: propLocalName, // Property name
          prefix: propPrefix || undefined, // Property prefix
          fullName: path, // Full URI
          type: datatype || 'http://www.w3.org/2001/XMLSchema#string', // Default to string
          minCardinality: minCount !== undefined ? minCount.toString() : '0', // Min cardinality
          maxCardinality: maxCount !== undefined ? maxCount.toString() : '1' // Max cardinality
        });
      }
    }

    // Add class to schema
    schema.Classes.push({
      localName,
      prefix: prefix || undefined,
      fullName: classUri,
      SuperClasses: superClasses.map(uri => {
        const { prefix: scPrefix, localName: scLocalName } = getLocalNameAndPrefix(uri);
        return scPrefix ? `${scPrefix}:${scLocalName}` : uri; // Format superclass
      }),
      instanceCount,
      properties: properties.length > 0 ? properties : undefined // Add properties if any
    });
  }

  // Find all property shapes for attributes and associations
  const propertyShapes = new Set();
  store.forEach(quad => {
    if (quad.predicate.value === `${SHACL}property` && classUris.has(quad.subject.value)) {
      propertyShapes.add(quad.object.value); // Add property shape
    }
  });

  // Process each property shape
  for (const propShape of propertyShapes) {
    let path, datatype, classTarget, minCount, maxCount, nodeShape; // Property details
    const orTargets = []; // List of targets for sh:or
    let orEntities = 0; // Entity count from sh:or

    store.forEach(quad => {
      if (quad.subject.value === propShape) {
        if (quad.predicate.value === `${SHACL}path`) path = quad.object.value; // Property path
        if (quad.predicate.value === `${SHACL}datatype`) datatype = quad.object.value; // Data type
        if (quad.predicate.value === `${SHACL}class`) classTarget = quad.object.value; // Target class
        if (quad.predicate.value === `${SHACL}minCount`) minCount = parseInt(quad.object.value); // Min cardinality
        if (quad.predicate.value === `${SHACL}maxCount`) maxCount = parseInt(quad.object.value); // Max cardinality
        if (quad.predicate.value === `${SHACL}node`) nodeShape = quad.object.value; // Node shape
        if (quad.predicate.value === `${SHACL}or`) {
          // Handle sh:or constraints
          store.forEach(orQuad => {
            if (orQuad.subject.value === quad.object.value && orQuad.predicate.value === RDF_TYPE && orQuad.object.value === `${SHACL}PropertyShape`) {
              store.forEach(innerQuad => {
                if (innerQuad.subject.value === orQuad.subject.value) {
                  if (innerQuad.predicate.value === `${SHACL}class`) {
                    orTargets.push(innerQuad.object.value); // Add target class
                  } else if (innerQuad.predicate.value === `${VOID}entities`) {
                    orEntities += parseInt(innerQuad.object.value) || 0; // Add entity count
                  }
                }
              });
            }
          });
        }
      }
    });

    if (!path) continue; // Skip if no path
    const { prefix, localName } = getLocalNameAndPrefix(path); // Get prefix and name
    const sourceClasses = []; // Find source classes
    store.forEach(quad => {
      if (quad.predicate.value === `${SHACL}property` && quad.object.value === propShape) {
        sourceClasses.push(quad.subject.value); // Add source class
      }
    });

    // Create property object
    const prop = {
      localName,
      prefix: prefix || undefined,
      fullName: path,
      minCardinality: minCount !== undefined ? minCount.toString() : '0', // Min cardinality
      maxCardinality: maxCount !== undefined ? maxCount.toString() : (datatype ? '1' : '-1'), // Max cardinality
      SourceClasses: sourceClasses.map(uri => {
        const { prefix: scPrefix, localName: scLocalName } = getLocalNameAndPrefix(uri);
        return scPrefix ? `${scPrefix}:${scLocalName}` : uri; // Format source class
      })
    };

    // Add as attribute if it has a datatype
    if (datatype) {
      prop.type = datatype;
      schema.Attributes.push(prop);
    } 
    // Add as association if it links to classes
    else if (classTarget || nodeShape || orTargets.length > 0) {
      let targets = [];
      if (classTarget) targets.push(classTarget); // Add target class
      if (orTargets.length > 0) targets = [...new Set([...targets, ...orTargets])]; // Add sh:or targets
      if (nodeShape) {
        store.forEach(quad => {
          if (quad.subject.value === nodeShape && quad.predicate.value === `${SHACL}targetClass`) {
            targets.push(quad.object.value); // Add target class from node shape
          }
        });
      }

      // Create class pairs for associations
      prop.ClassPairs = sourceClasses.flatMap(src => {
        const { prefix: srcPrefix, localName: srcLocalName } = getLocalNameAndPrefix(src);
        return targets.map(tgt => {
          const { prefix: tgtPrefix, localName: tgtLocalName } = getLocalNameAndPrefix(tgt);
          return {
            SourceClass: srcPrefix ? `${srcPrefix}:${srcLocalName}` : src,
            TargetClass: tgtPrefix ? `${tgtPrefix}:${tgtLocalName}` : tgt
          };
        });
      });

      // Set triple count
      if (orEntities > 0) {
        prop.tripleCount = orEntities; // Use sh:or count
      } else {
        prop.tripleCount = await fetchEntityCount(path, false, sparqlEndpoint); // Fetch via SPARQL
      }

      schema.Associations.push(prop); // Add to associations
    }
  }

  // Add prefixes to schema
  schema.Prefixes = extractPrefixes(store, namespaces, schema);

  return schema; // Return the schema
};

// Save the schema to a JSON file
// Takes the schema and output path; saves the file
const saveSchema = async (schema, outputFilePath) => {
  try {
    await fs.writeFile(outputFilePath, JSON.stringify(schema, null, 2)); // Write JSON with formatting
    console.log(`Conversion complete! Output saved to ${outputFilePath}`);
  } catch (error) {
    throw new Error(`Failed to save JSON file: ${error.message}`); // Handle errors
  }
};

// Create a timeout promise
// Takes milliseconds and rejects if time runs out
const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
);

// Main function to run the conversion
const main = async () => {
  try {
    console.log('Starting conversion process...');
    
    // Read config and namespaces
    console.log('Reading configuration...');
    const config = await readConfig();
    console.log('Reading namespaces...');
    const namespaces = await readNamespaces(config.namespacesFilePath);

    // Parse the SHACL file
    console.log(`Parsing SHACL file: ${config.shaclFilePath}`);
    const store = await parseTurtleFile(config.shaclFilePath);
    
    // Convert to ViziQuer schema with timeout
    console.log('Converting to ViziQuer schema...');
    const schemaName = path.basename(config.shaclFilePath, '.ttl'); // Get schema name from file
    const schema = await Promise.race([
      convertToViziQuerSchema(store, schemaName, config.sparqlEndpoint, namespaces),
      timeout(TIMEOUT_MS) // Apply timeout
    ]);

    // Save the schema
    console.log('Saving JSON schema...');
    await saveSchema(schema, config.outputFilePath);
    
    console.log('Process completed successfully.');
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error(`Error during conversion: ${error.message}`); // Log error
    process.exit(1); // Exit with error
  }
};

// Start the script
main();
// Importing required modules for file handling, path manipulation, and RDF parsing
const fs = require('fs').promises;
const path = require('path');
const { Parser, Store } = require('n3');//for reading and parsin RDF data

// Defining RDF namespaces used in the SHACL file 
// TODO: should be defined by inputted file i think, defined for example here: <http://www.w3.org/ns/shacl#targetClass> <https://dblp.org/rdf/schema#Book>
const SHACL = 'http://www.w3.org/ns/shacl#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const DBLP = 'https://dblp.org/rdf/schema#';

// Function to parse turtle file to store RDF data
// Used N3 library to read the turtle file and store its triplets
async function parseTurtleFile(filePath) {
  try {
    // Reading turtle file content
    const turtleContent = await fs.readFile(filePath, 'utf8');
    const parser = new Parser();
    const store = new Store();
    // Parsing the content into the store
    return new Promise((resolve, reject) => {
      parser.parse(turtleContent, (error, quad) => {
        if (error) reject(error);
        else if (quad) store.addQuad(quad);
        else resolve(store);
      });
    });
  } catch (error) {
    throw new Error(`Failed to parse Turtle file: ${error.message}`);
  }
}

// converting SHACL to JSON
async function convertShaclToObis(shaclFilePath, outputFilePath) {
  try {
    // Checking if the input file exists
    if (!(await fs.access(shaclFilePath).then(() => true).catch(() => false))) {
      throw new Error(`Input file not found: ${shaclFilePath}`);
    }

    // Parsing the SHACL Turtle file
    console.log(`Parsing SHACL file: ${shaclFilePath}`);
    const store = await parseTurtleFile(shaclFilePath);

    // Initializing the OBIS schema structure
    // This should match the format required by ViziQuer and DSS
    const obisSchema = {
      SchemaName: path.basename(shaclFilePath, '.ttl'),
      Classes: [],
      Properties: [],
      Parameters: [
        { name: 'endpointUrl', value: 'http://85.254.199.72:8890/sparql' },
        { name: 'graphName', value: path.basename(shaclFilePath, '.ttl') },
        { name: 'calculateSubClassRelations', value: 'true' },
        { name: 'calculateDomainAndRangePairs', value: 'true' },
        { name: 'calculateDataTypes', value: 'true' },
        { name: 'calculateCardinalities', value: 'propertyLevelAndClassContext' },
        { name: 'minimalAnalyzedClassSize', value: '0' }
      ],
      Prefixes: [//TODO: write to separate file would be better
        { prefix: 'sh', namespace: SHACL },
        { prefix: 'rdf', namespace: RDF },
        { prefix: 'xsd', namespace: XSD },
        { prefix: 'rdfs', namespace: RDFS },
        { prefix: 'dblp', namespace: DBLP }
      ]
    };

    // Extracting NodeShapes (classes) from the SHACL file
    // NodeShapes define the classes like Book and Person
    const nodeShapes = store.getQuads(null, RDF + 'type', SHACL + 'NodeShape');
    for (const shapeQuad of nodeShapes) {
      const shapeUri = shapeQuad.subject.value;
      const targetClassQuad = store.getQuads(shapeUri, SHACL + 'targetClass', null)[0];
      if (!targetClassQuad) continue; // Skip if no target class

      const classUri = targetClassQuad.object.value;
      // Only include classes from DBLP namespace right now to avoid external classes
      // TODO: should be dynamic
      if (!classUri.startsWith(DBLP)) continue;

      // Extracting local name and namespace from the class URI
      const localName = classUri.split('#').pop() || classUri.split('/').pop();
      const namespace = classUri.substring(0, classUri.lastIndexOf('#') + 1);

      // Adding class to the schema
      obisSchema.Classes.push({
        localName,
        namespace,
        fullName: classUri,
        instanceCount: 1, // Fictive count
        propertiesInSchema: true,
        SuperClasses: [RDFS + 'Resource'], // Default superclass
        OutgoingProperties: [],
        IncomingProperties: []
      });
      console.log(`Added class: ${localName}`);
    }

    // Extracting PropertyShapes (properties) from the SHACL file like authoredBy, title, primaryCreatorName
    const propertyShapes = store.getQuads(null, RDF + 'type', SHACL + 'PropertyShape');
    for (const propQuad of propertyShapes) {
      const propUri = propQuad.subject.value;
      const pathQuad = store.getQuads(propUri, SHACL + 'path', null)[0];
      if (!pathQuad) continue; // Skip if no path

      const propertyUri = pathQuad.object.value;
      // Only include DBLP properties and exclude rdf:type
      // TODO: should be dynamic
      if (!propertyUri.startsWith(DBLP) || propertyUri === RDF + 'type') continue;

      // Extracting local name and namespace
      const localName = propertyUri.split('#').pop() || propertyUri.split('/').pop();
      const namespace = propertyUri.substring(0, propertyUri.lastIndexOf('#') + 1);

      // Getting SHACL constraints for the property
      const minCountQuad = store.getQuads(propUri, SHACL + 'minCount', null)[0];
      const maxCountQuad = store.getQuads(propUri, SHACL + 'maxCount', null)[0];
      const datatypeQuad = store.getQuads(propUri, SHACL + 'datatype', null)[0];
      const classQuad = store.getQuads(propUri, SHACL + 'class', null)[0];

      const minCount = minCountQuad ? parseInt(minCountQuad.object.value) : 0;
      const maxCount = maxCountQuad ? parseInt(maxCountQuad.object.value) : -1;
      const datatype = datatypeQuad ? datatypeQuad.object.value : null;
      const targetClass = classQuad ? classQuad.object.value : null;

      // Finding the source class (NodeShape referencing this PropertyShape)
      let sourceClass = null;
      for (const shapeQuad of nodeShapes) {
        const shapeUri = shapeQuad.subject.value;
        const propRefs = store.getQuads(shapeUri, SHACL + 'property', propUri);
        if (propRefs.length > 0) {
          const targetClassQuad = store.getQuads(shapeUri, SHACL + 'targetClass', null)[0];
          if (targetClassQuad) {
            sourceClass = targetClassQuad.object.value;
            break;
          }
        }
      }

      if (!sourceClass) continue; // Skip if no source class

      // Building the property object
      // TODO: to not use fictive counts. All included to try to match OBIS structure
      const property = {
        localName,
        namespace,
        fullName: propertyUri,
        maxCardinality: maxCount,
        maxInverseCardinality: -1, // Fictive
        tripleCount: 1, // Fictive
        dataTripleCount: datatype ? 1 : 0, // Fictive
        objectTripleCount: targetClass ? 1 : 0, // Fictive
        closedDomain: true,
        closedRange: !!targetClass,
        DataTypes: datatype ? [{ dataType: datatype, tripleCount: 1 }] : [],
        SourceClasses: [{
          classFullName: sourceClass,
          tripleCount: 1,
          dataTripleCount: datatype ? 1 : 0,
          objectTripleCount: targetClass ? 1 : 0,
          closedRange: true,
          importanceIndex: 1,
          minCardinality: minCount,
          maxCardinality: maxCount
        }],
        TargetClasses: targetClass ? [{
          classFullName: targetClass,
          tripleCount: 1,
          closedDomain: true,
          importanceIndex: 1,
          minInverseCardinality: 0,
          maxInverseCardinality: -1
        }] : [],
        ClassPairs: [], // TODO
        Followers: [],// TODO
        OutgoingProperties: [],// TODO
        IncomingProperties: []// TODO
      };

      obisSchema.Properties.push(property);
      console.log(`Added property: ${localName}`);
    }

    // Saving the schema to JSON file
    await fs.writeFile(outputFilePath, JSON.stringify(obisSchema, null, 2));
    console.log(`Conversion complete! Output saved to ${outputFilePath}`);
  } catch (error) {
    console.error(`Error during conversion: ${error.message}`);
    process.exit(1);
  }
}

// Running the conversion with command-line argument
// For first run - parcel should be installed on the machine, run command in terminal: npm install
// Run script from terminal ../path_to_script/> node shacl_to_obis.js <input.ttl> <output.json> <http://85.254.199.72:8890/sparql>
// TODO connection to Virtuoso in development
async function main() {
  const args = process.argv.slice(2);
  const shaclFilePath = args[0] || 'dblp_books_QSE_FULL_SHACL.ttl';
  const outputFilePath = args[1] || 'converted_obis_schema.json';
  const sparqlEndpoint = args[2] || 'http://85.254.199.72:8890/sparql';
  await convertShaclToObis(shaclFilePath, outputFilePath, sparqlEndpoint);
}

main();
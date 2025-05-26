# SHACL to ViziQuer JSON Converter
This repository contains files for converting SHACL schemas in Turtle (.ttl) format to ViziQuer-compatible JSON format, designed for integration with the ViziQuer tool (https://github.com/LUMII-Syslab/viziquer).
Script was developed as part of the bachelor's thesis "METHODS FOR EXTRACTING DATA SCHEMAS FROM KNOWLEDGE GRAPHS" and processes RDF data, such as the DBLP dataset (dblp_1M.nt).

# Features
- Parses SHACL schemas using the n3 library.
- Generates statistical data via SPARQL queries if not present.
- Converts SHACL structures to JSON format.
- Handles errors (e.g., invalid IRIs) with a 5-minute timeout.
- Tested with DBLP dataset for ViziQuer visualization.

# Installation
- Clone the repository:
```
git clone https://github.com/Arinkadzu/shacl_to_json.git
cd shacl_to_json
```

- Install dependencies:
```npm install```

# Usage

- Place your SHACL schema (.ttl) in the project directory "Inputs".
- Configure the configuration file with correct path for input and output files and SPARQL endpoint (if needed).
```
{
  "shaclFilePath": "../SHACLtoJSON/Inputs/<SHACL.ttl>",
  "outputFilePath": "../SHACLtoJSON/Results/<SHACL.json>",
  "sparqlEndpoint": "http://85.254.199.72:8890/sparql",
  "namespacesFilePath": "../SHACLtoJSON/namespaces.json" //Took from https://github.com/LUMII-Syslab/OBIS-SchemaExtractor/blob/master/build/namespaces.json
}
```
- Run the script:
```
node shacl_to_viziquer.js
```

Receive output file in Results directory

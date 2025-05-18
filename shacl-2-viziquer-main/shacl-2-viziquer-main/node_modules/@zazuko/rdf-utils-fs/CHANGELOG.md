# @zazuko/rdf-utils-fs

## 3.3.1

### Patch Changes

- 41b6810: Remove `FormatsFactory` imported from `@rdfjs/environment`

## 3.3.0

### Minor Changes

- 170f9ae: Update `@rdfjs/environment` to v1
- 170f9ae: Replace `@rdfjs/formats-common` with `@rdfjs/formats`

## 3.2.0

### Minor Changes

- 738dafa: Add an option to assume `baseIRI` to be the `file://` of the document itself when parsing.

## 3.1.0

### Minor Changes

- ab46d14: Allow `URL` as path argument of `toFile` and `fromFile`

## 3.0.2

### Patch Changes

- 7062ab8: `toFile` was not types as async in factory

## 3.0.1

### Patch Changes

- 18d44d3: Restore @bergos as original author and have Zazuko as contributor

## 3.0.0

### Major Changes

- 199cbd4: Removed direct dependency on formats package which must be provided by RDF/JS Environment
- 1406b72: Added new first argument in function `toFile` and `fromFile` which is an RDF/JS Enviornment
- 3e2fef2: Hard fork from rdf-ext/rdf-utils-fs
- 199cbd4: Convert package to ESM
- 218ffc1: Add Factory compliant with RDF/JS

### Minor Changes

- 9ac9cec: Convert source code to TypeScript, bundle type declarations

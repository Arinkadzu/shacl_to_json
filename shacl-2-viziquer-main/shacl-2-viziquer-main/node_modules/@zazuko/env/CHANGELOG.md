# @zazuko/env

## 2.0.6

### Patch Changes

- ef30fa1: Extracted a new package `@zazuko/env-core` with the extended `@rdfjs/environment`
- Updated dependencies [ef30fa1]
  - @zazuko/env-core@1.0.0

## 2.0.5

### Patch Changes

- 02d83c8: Add peer dependency on `@rdfjs/types`

## 2.0.4

### Patch Changes

- 360d02c: Missing dependency on `@rdfjs/formats`

## 2.0.3

### Patch Changes

- c3a88ff: When extending a parent environment multiple times, properties were set on the parent instead of child, causing it to be overwritten
- c3a88ff: Added proxy trap for `Object.keys` to extended environments

## 2.0.2

### Patch Changes

- 1ddac0f: Fixes a weird build problem that generated types referenced `TermSetFactory` from rdf-ext, although it was not used at all. Had to remove `rdf-ext` from dev dependencies of `@zazuko/env` to fix it.

## 2.0.1

### Patch Changes

- a9b5fb3: Missing peer dependencies on types

## 2.0.0

### Major Changes

- 2aab3d0: Change the method of creating derived environments:

  1. The additional factories have been removed from the `create` function.
  2. To create a derived environment, use the constructor overload which takes a parent environment as the second argument in addition to the array of additional factories.

  For example,

  ```js
  import env from "@zazuko/env";
  import Environment from "@zazuko/env/Environment.js";
  import MyFactory from "./my-factory.js";

  const myEnv = new Environment([MyFactory], { parent: env });
  ```

## 1.11.1

### Patch Changes

- 8cc7a4e: `Dataset#serialize` would fail with some parsers when unrecognized prefix was used
- bf2c9a1: Update to `@rdfjs/environment` v1 and its updated dependencies. Notably, `@rdfjs/formats` replaced `@rdfjs/formats-common`

## 1.11.0

### Minor Changes

- 5c592b1: `Dataset#forEach` function, same as in rdf-ext

## 1.10.1

### Patch Changes

- 9beb39b: `graph` was ignored by `Dataset#deleteMatches`

## 1.10.0

### Minor Changes

- f6918de: Add option to set serializer prefixes

## 1.9.0

### Minor Changes

- b9b21f3: Added a `serialize` method to dataset

### Patch Changes

- 38ca62c: Remove test files from package

## 1.8.0

### Minor Changes

- d35c37a: Added `filter` function to dataset

## 1.7.0

### Minor Changes

- eeff594: Added `@rdfjs/traverser`

## 1.6.1

### Patch Changes

- 2489572: `match` was annotated with wrong return type

## 1.6.0

### Minor Changes

- 1c9e4b7: Added dataset method `merge`

## 1.5.2

### Patch Changes

- 883a942: Require types for `rdf-dataset-ext` as peer dependency

## 1.5.1

### Patch Changes

- a730d4d: `addAll` should return self to allow chaining

## 1.5.0

### Minor Changes

- 9c51424: Added `map` method to `Dataset`

### Patch Changes

- 9c51424: Removed TS files from package

## 1.4.1

### Patch Changes

- 795d163: Wrongly named `Dateset#fromStream` which is now `Dataset#import`
- dc6e936: NPM meta

## 1.4.0

### Minor Changes

- bc03fa1: Implement methods from `rdf-dataset-ext` on dataset type to match `rdf-ext` functionality

## 1.3.2

### Patch Changes

- f1ba616: Updates to `clownface@2.0.1` which fix a blank node clash bug

## 1.3.1

### Patch Changes

- 7b3a1cb: Depending on types directly may cause TS issues

## 1.3.0

### Minor Changes

- 4d72579: Export helper type for creating derived environments

## 1.2.0

### Minor Changes

- 6007138: Export the type of default env

## 1.1.1

### Patch Changes

- 538aeaa: Include required types packages

## 1.1.0

### Minor Changes

- 87efd68: Added term set and term map

## 1.0.1

### Patch Changes

- ce1072c: Added type declarations

## 1.0.0

### Major Changes

- f0ede7f: First release

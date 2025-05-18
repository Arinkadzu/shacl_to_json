# @zazuko/rdf-utils-fs

![Build Status](https://github.com/zazuko/rdf-utils-fs/actions/workflows/ci.yaml/badge.svg?branch=master)
[![npm version](https://badge.fury.io/js/@zazuko%2Frdf-utils-fs.svg)](https://badge.fury.io/js/@zazuko%2Frdf-utils-fs)

File system utils for RDF/JS.

## Usage with `@zazuko/env-node` (preferred)

[@zazuko/env-node](https://npm.im/@zazuko/env-node) package extends [@zazuko/env](https://npm.im/@zazuko/env) by including
the fs utils and default parsers/serializers for simplest possible usage in node environment.

```js
import rdf from '@zazuko/env-node'
        
// parse
const dataset = await env.dataset().import(env.fromFile(`/path/to/data.nt`))

// serialise
await env.toFile(dataset, `/path/to/data.json`)
```

## Extend `@zazuko/env` yourself

```js
import Environment from '@zazuko/env/Environment.js'
import baseEnv from '@zazuko/env`
import { FsUtilsFactory } from '@zazuko/rdf-utils-fs'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import formats from '@rdfjs/formats'

// create an environment by adding FsUtilsFactory
const env = new Environment([FsUtilsFactory], { parent: baseEnv })
// add parsers+serializers
env.formats.import(formats)

// parse
const dataset = await env.dataset().import(env.fromFile(`/path/to/data.nt`))

// serialise
await env.toFile(dataset.toStream(), `/path/to/data.json`)
```

## Usage with an existing environment

Same as above, but the RDF/JS Environment is provided as first argument. 
That environment must implement RDF/JS DataFactory, [FormatsFactory](https://github.com/rdfjs-base/formats/tree/master/Factory.js).

```js
import rdf from 'rdf-ext'
import { fromFile, toFile } from 'rdf-utils-fs'
import formats from '@rdfjs/formats'

// add parsers+serializers
rdf.formats.import(formats)

// parse
const parserStream = fromFile(rdf, `/path/to/data.nt`)
const dataset = await rdf.dataset().import(parserStream)

// serialise
await env.toFile(rdf, dataset, `/path/to/data.json`)
```
    
## Functions

### fromFile(filename, options)

Returns a quad stream for the given `filename`.

By default, the file is parsed without a base IRI. If you want to use the file's IRI as base, pass `{ implicitBaseIRI: true }` as options.

### async toFile(stream, filename, options)

Writes the given quad stream to `filename`. 

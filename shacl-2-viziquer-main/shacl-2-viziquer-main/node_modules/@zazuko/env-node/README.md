# [RDF/JS Environment](https://github.com/rdfjs-base/environment) with NodeJs support

This package extends [@zazuko/env](https://npm.im/@zazuko/env) by adding support for NodeJs.

It includes [`@zazuko/rdf-utils-fs`](@zazuko/rdf-utils-fs) and [`@rdfjs/fetch-lite`](https://npm.im/@rdfjs/fetch-lite)
and bundles the default set of parsers and serializers.

## Using different serializers

It is possible to switch the formats by importing them from a different package. For example,
using the pretty-printing package.

```js
import rdf from '@zazuko/env-node'
import formats from '@rdfjs-elements/formats-pretty'

rdf.formats.import(formats)
```

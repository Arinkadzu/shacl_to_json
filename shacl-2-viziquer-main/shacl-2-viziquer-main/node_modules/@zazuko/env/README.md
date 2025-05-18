# Zazuko's [RDF/JS Environment](https://github.com/rdfjs-base/environment)

Like `rdf-ext`, with some additional features.

```js
import env from '@zazuko/env'

// bind namespace to create named nodes
const tbbt = env.namespace('https://tbbt.tv/')

// use clownface for easy graph manipulation
const sheldonCooper = env.clownface()
  .namedNode(tbbt.sheldon)
  // use common vocabularies out-of-the box  
  .addOut(env.ns.rdf.type, env.ns.schema.Person)
  .addOut(env.ns.schema.knows, tbbt.leonard)
```

## Additional features

### Dataset

#### `rdf-ext` functionality

The provided `DatasetCore` implementation provides additional methods, matching the `rdf-ext` interface.

#### Serializing

It also includes a `serialize` method to easily get a string representation for supported formats.
Serializers are not added out of the box and the need to be imported first

```js
import rdf from '@zazuko/env'
import formats from '@rdfjs/formats'

rdf.formats.import(formats)

const dataset = rdf.dataset()

// create some data

const turtle = await dataset.serialize({ format: 'text/turtle' })
```

#### Extending environments

This package adds the ability to create environments on top of existing ones. To do that, pass the parent environment to the constructor options.

```js
import env from '@zazuko/env';
import Environment from '@zazuko/env/Environment.js';
import MyFactory from './my-factory.js';

const myEnv = new Environment([MyFactory], { parent: env });
```

The `myEnv` will have all the factories from `env` and `MyFactory`.

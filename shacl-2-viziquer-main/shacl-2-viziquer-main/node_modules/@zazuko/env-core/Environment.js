import { extend } from './lib/extend.js'

export default class Environment {
  constructor(factories, { parent, bind = false } = {}) {
    this._parent = parent
    this._factories = factories.slice()

    const extended = parent ? extend({ parent, child: this }) : this

    for (const factory of this._factories) {
      if (typeof factory.prototype.init === 'function') {
        factory.prototype.init.call(extended)
      }

      for (const method of factory.exports || []) {
        if (bind) {
          this[method] = factory.prototype[method].bind(extended)
        } else {
          this[method] = factory.prototype[method]
        }
      }
    }

    return extended
  }

  clone() {
    const env = new Environment(this._factories, this._parent)

    for (const factory of env._factories) {
      if (typeof factory.prototype.clone === 'function') {
        factory.prototype.clone.call(env, this)
      }
    }

    return env
  }
}

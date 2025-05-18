/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Environment, FactoryConstructor } from '@rdfjs/environment/Environment.js'
import { DerivedEnvironment } from './lib/extend.js'

export { DerivedEnvironment } from './lib/extend.js'

type Narrow<T> =
  | (T extends infer U ? U : never)
  | Extract<T, number | string | boolean | bigint | symbol | null | undefined | []>
  | ([T] extends [[]] ? [] : { [K in keyof T]: Narrow<T[K]> });

type ReturnFactory<C> = C extends FactoryConstructor<infer X> ? X : C;
type Distribute<U> = U extends any ? ReturnFactory<U> : never;

interface EnvironmentCtor {
  new<F extends ReadonlyArray<FactoryConstructor<any>>>(
    factories: Narrow<F>,
    options?: { bind: boolean },
  ): Environment<Distribute<F[number]>>

  new<F extends ReadonlyArray<FactoryConstructor<any>>, E extends Environment<any>>(
    factories: Narrow<F>,
    options: { parent?: E; bind?: boolean },
  ): DerivedEnvironment<E, Environment<Distribute<F[number]>>>
}

declare const environment: EnvironmentCtor

export default environment

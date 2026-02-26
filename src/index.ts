import { StackStorage } from './internal/stack-storage';
import { Mock } from './internal/symbol';

export type Resolver<T> = () => T;

export type Provider<T> = {
  <R>(builder: () => T, fn: () => R): R;
  (builder: () => T): <R>(fn: () => R) => R;
  transient: {
    <R>(builder: () => T, fn: () => R): R;
    (builder: () => T): <R>(fn: () => R) => R;
  };
  [Mock]?: T | (() => T) | undefined;
};

export type CreateContext = {
  <T>(options?: { required?: true }): [Resolver<T>, Provider<T>];
  <T>(options: { required: false }): [Resolver<T | undefined>, Provider<T | undefined>];
};

export const createContext: CreateContext = <T>({
  required = true,
} = {}): [Resolver<T | undefined>, Provider<T | undefined>] => {
  const storage = new StackStorage<() => T | undefined>();

  const provider: Provider<T | undefined> = <R>(builder: () => T | undefined, fn?: () => R): R | ((fn: () => R) => R) => {
    const providerFn = (fn: () => R) => {
      let cache: T | undefined;
      let initialized = false;

      const builderFn = (): T | undefined => {
        if (!initialized) {
          cache = builder();
          initialized = true;
        }
        return cache;
      };

      return storage.run(builderFn, fn);
    };

    return fn ? providerFn(fn) : providerFn;
  };

  provider.transient = <R>(builder: () => T | undefined, fn?: () => R): R | ((fn: () => R) => R) => {
    const providerFn = (fn: () => R) => {
      return storage.run(builder, fn);
    };

    return fn ? providerFn(fn) : providerFn;
  };

  const resolver: Resolver<T | undefined> = () => {
    using builder = storage.getItem();
    if (!builder) {
      if (provider[Mock] !== undefined) {
        return typeof provider[Mock] === 'function' ? (provider[Mock] as () => T)() : provider[Mock];
      }
      if (required) {
        throw new Error('Context not provided. Use scoped() or transient() to set a value.');
      }
      return;
    }
    return builder();
  };

  return [resolver, provider];
};

export type WithContexts = {
  <R>(contexts: Array<(fn: () => R) => R>, fn: () => R): R;
  <R>(contexts: Array<(fn: () => R) => R>): (fn: () => R) => R;
};

export const withContexts: WithContexts = <R>(
  contexts: Array<(fn: () => R) => R>,
  fn?: () => R,
): R | ((fn: () => R) => R) => {
  const execute = (fn: () => R): R => {
    const [provider, ...rest] = contexts;
    if (!provider) return fn();
    return provider(() => withContexts(rest, fn));
  };

  if (fn !== undefined) return execute(fn);
  return execute;
};

import { StackStorage } from './internal/stack-storage';
import { Mock } from './internal/symbol';

export type Context<T> = {
  (): T;
  scoped: {
    <R>(builder: () => T, fn: () => R): R;
    (builder: () => T): <R>(fn: () => R) => R;
  };
  transient: {
    <R>(builder: () => T, fn: () => R): R;
    (builder: () => T): <R>(fn: () => R) => R;
  };
  [Mock]: T | (() => T) | undefined;
};

export type CreateContext = {
  <T>(options?: { required?: true }): Context<T>;
  <T>(options: { required: false }): Context<T | undefined>;
};

export const createContext: CreateContext = <T>({
  required = true,
} = {}): Context<T> | Context<T | undefined> => {
  const storage = new StackStorage<() => T | undefined>();

  const context = (() => {
    using builder = storage.getItem();
    if (!builder) {
      if (context[Mock] !== undefined) {
        return typeof context[Mock] === 'function' ? (context[Mock] as () => T)() : context[Mock];
      }
      if (required) {
        throw new Error('Context not provided. Use scoped() or transient() to set a value.');
      }
      return;
    }
    return builder();
  }) as Context<T | undefined>;

  context.scoped = <R>(builder: () => T | undefined, fn?: () => R): R | ((fn: () => R) => R) => {
    const provider = (fn: () => R) => {
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

    return fn ? provider(fn) : provider;
  };

  context.transient = <R>(builder: () => T | undefined, fn?: () => R): R | ((fn: () => R) => R) => {
    const provider = (fn: () => R) => {
      return storage.run(builder, fn);
    };

    return fn ? provider(fn) : provider;
  };

  return context;
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

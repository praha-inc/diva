import { StackStorage } from './internal/stack-storage';
import { Mock } from './internal/symbol';

/**
 * A function that resolves a value of type T from the current context.
 *
 * @typeParam T - The type of value to resolve
 * @returns The resolved value from the context
 * @throws Error if the context is required but not provided
 *
 * @remarks
 * The resolver function retrieves the value from the current execution context.
 * If the context was created with `required: true` (default), it will throw an error
 * when called outside a provider scope. If `required: false`, it returns undefined
 * when no provider is active.
 *
 * @example
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Inside a provider scope
 * withDatabase(() => new Database(), () => {
 *   // Returns Database instance
 *   const db = database();
 * });
 *
 * // Outside a provider scope (throws error)
 * const db = database(); // Error: Context not provided
 * ```
 */
export type Resolver<T> = () => T;

/**
 * A provider function type that supports both direct and curried invocation patterns.
 *
 * @typeParam T - The type of value provided by this context
 *
 * @remarks
 * ProviderFn is the core function type for establishing context scopes.
 * It supports two calling patterns for flexibility:
 * 1. Direct call: `provider(builder, fn)` - Immediately executes fn within the context
 * 2. Curried call: `provider(builder)(fn)` - Returns a function that will execute fn within the context
 *
 * This type is used as the base for the {@link Provider} type, which extends it
 * with additional properties like `transient` for different scoping strategies.
 *
 * @example
 * Direct invocation
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Direct call - builder and fn are passed together
 * withDatabase(() => new Database(), () => {
 *   const db = database();
 *   // Use database instance
 * });
 * ```
 *
 * @example
 * Curried invocation
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Curried call - builder is passed first, returns a function
 * const run = withDatabase(() => new Database());
 *
 * // Execute within the scoped context later
 * run(() => {
 *   const db = database();
 *   // Use database instance
 * });
 * ```
 */
export type ProviderFn<T> = {
  /**
   * Provides a context value within a scope using direct invocation.
   *
   * @typeParam R - The return type of the function to execute
   * @param builder - A function that builds/creates the context value
   * @param fn - The function to execute within the context scope
   * @returns The result of executing fn
   */
  <R>(builder: () => T, fn: () => R): R;

  /**
   * Provides a context value using curried invocation.
   *
   * @typeParam R - The return type of the function to execute
   * @param builder - A function that builds/creates the context value
   * @returns A function that accepts fn and executes it within the context scope
   */
  (builder: () => T): <R>(fn: () => R) => R;
};

/**
 * A provider function that establishes a context scope with a given value builder.
 *
 * @typeParam T - The type of value provided by this context
 *
 * @remarks
 * Provider supports two calling patterns:
 * 1. Direct call: `Provider(builder, fn)` - Immediately executes fn within the context
 * 2. Curried call: `Provider(builder)(fn)` - Returns a function that will execute fn within the context
 *
 * By default, the provider caches the built value (scoped/singleton pattern).
 * Use the `transient` property for a new instance on each resolution.
 *
 * @example
 * Direct call
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Direct call
 * withDatabase(() => new Database(), () => {
 *   const db1 = database(); // Same instance
 *   const db2 = database(); // Same instance (cached)
 * });
 *
 * // Transient (new instance each time)
 * withDatabase.transient(() => new Database(), () => {
 *   const db1 = database(); // New instance
 *   const db2 = database(); // Different instance
 * });
 * ```
 *
 * @example
 * Curried call
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Curried call
 * const scopedDatabase = withDatabase(() => new Database());
 * scopedDatabase(() => {
 *   const db1 = database(); // Same instance
 *   const db2 = database(); // Same instance (cached)
 * });
 *
 * // Transient (new instance each time)
 * const transientDatabase = withDatabase.transient(() => new Database());
 * transientDatabase(() => {
 *   const db1 = database(); // New instance
 *   const db2 = database(); // Different instance
 * });
 * ```
 */
export type Provider<T> = ProviderFn<T> & {
  /**
   * Transient provider that creates a new instance on each resolution.
   *
   * @remarks
   * Unlike the default scoped behavior which caches the built value,
   * transient creates a new instance every time the resolver is called.
   */
  transient: ProviderFn<T>;

  /**
   * Mock value or factory function for testing purposes.
   *
   * @remarks
   * When set, the resolver will return this value (or call this function)
   * instead of throwing an error when no provider is active.
   * This is useful for testing components that use contexts.
   */
  [Mock]?: T | (() => T) | undefined;
};

/**
 * Factory function for creating context pair (resolver and provider).
 *
 * @remarks
 * Creates a pair of [Resolver, Provider] that work together to manage
 * a dependency injection context. The resolver retrieves values from the
 * current context, while the provider establishes the context scope.
 *
 * Supports two modes:
 * - Required (default): Resolver throws error if context not provided
 * - Optional: Resolver returns undefined if context not provided
 *
 * @example
 * ```ts
 * import { createContext } from '@praha/diva';
 *
 * // Required context
 * const [logger, withLogger] = createContext<Logger>();
 *
 * // Optional context
 * const [loggerContext, withLoggerContext] = createContext<Record<string, unknown>>({
 *   required: false
 * });
 *
 * withLogger(() => new Logger(), () => {
 *   withLoggerContext(() => ({ timestamp: new Date() }), () => {
 *     logger.info('This is a log message with context', loggerContext()); // Logs with timestamp context
 *   });
 *
 *   logger.info('This is a log message without context', loggerContext()); // Logs with undefined context
 * });
 * ```
 */
export type CreateContext = {
  /**
   * Creates a required context pair.
   *
   * @typeParam T - The type of value managed by this context
   * @param options - Configuration options (required defaults to true)
   * @returns A tuple of [Resolver, Provider] for the context
   */
  <T>(options?: { required?: true }): [Resolver<T>, Provider<T>];

  /**
   * Creates an optional context pair.
   *
   * @typeParam T - The type of value managed by this context
   * @param options - Configuration options with required set to false
   * @returns A tuple of [Resolver, Provider] for the optional context
   */
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

/**
 * A utility function for composing multiple context providers together.
 *
 * @typeParam R - The return type of the function to execute within the composed context
 *
 * @remarks
 * This function is a helper that can combine multiple context providers into a single composite context scope.
 * Instead of deeply nesting provider calls, you can pass an array of curried providers to create a cleaner,
 * more maintainable code structure.
 *
 * Supports two calling patterns:
 * 1. Direct call: `withContexts(contexts, fn)` - Immediately executes fn within all contexts
 * 2. Curried call: `withContexts(contexts)(fn)` - Returns a function that will execute fn within all contexts
 *
 * The contexts are applied in order, with the first context being the outermost and the last
 * being the innermost scope.
 *
 * @example
 * ```ts
 * import { createContext, withContexts } from '@praha/diva';
 *
 * const [database, withDatabase] = createContext<Database>();
 * const [logger, withLogger] = createContext<Logger>();
 * const [auth, withAuth] = createContext<Auth>();
 *
 * withContexts([
 *   withDatabase(() => new Database()),
 *   withLogger(() => new Logger()),
 *   withAuth(() => new Auth()),
 * ], () => {
 *   // All contexts are available here
 * });
 * ```
 */
export type WithContexts = {
  /**
   * Composes multiple context providers and executes a function within all contexts using direct invocation.
   *
   * @typeParam R - The return type of the function to execute
   * @param contexts - An array of curried provider functions to compose
   * @param fn - The function to execute within all composed context scopes
   * @returns The result of executing fn within all contexts
   *
   * @example
   * ```ts
   * import { createContext, withContexts } from '@praha/diva';
   *
   * const [database, withDatabase] = createContext<Database>();
   * const [logger, withLogger] = createContext<Logger>();
   * const [auth, withAuth] = createContext<Auth>();
   *
   * withContexts([
   *   withDatabase(() => new Database()),
   *   withLogger(() => new Logger()),
   *   withAuth(() => new Auth()),
   * ], () => {
   *   // All contexts are available here
   * });
   * ```
   */
  <R>(contexts: Array<(fn: () => R) => R>, fn: () => R): R;

  /**
   * Composes multiple context providers using curried invocation.
   *
   * @typeParam R - The return type of the function to execute
   * @param contexts - An array of curried provider functions to compose
   * @returns A function that accepts fn and executes it within all composed context scopes
   *
   * @example
   * ```ts
   * import { createContext, withContexts } from '@praha/diva';
   *
   * const [database, withDatabase] = createContext<Database>();
   * const [logger, withLogger] = createContext<Logger>();
   * const [auth, withAuth] = createContext<Auth>();
   *
   * const run = withContexts([
   *   withDatabase(() => new Database()),
   *   withLogger(() => new Logger()),
   *   withAuth(() => new Auth()),
   * ]);
   *
   * run(() => {
   *   // All contexts are available here
   * });
   * ```
   */
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

  return fn ? execute(fn) : execute;
};

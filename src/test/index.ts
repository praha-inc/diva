import { Mock } from '../internal/symbol';

import type { Provider } from '../index';

/**
 * A utility function type for setting mock values on context providers in tests.
 *
 * @typeParam T - The type of value provided by the context
 *
 * @remarks
 * This utility allows you to inject mock values into context providers without
 * needing to wrap your test code in provider scopes. It's particularly useful
 * for unit testing components that depend on contexts.
 *
 * Supports two modes:
 * - **Scoped** (default): Sets a pre-built mock value that will be returned on each resolution
 * - **Transient**: Sets a mock factory function that creates a new instance on each resolution
 *
 * @example
 * Mocking with a scoped value
 * ```ts
 * import { createContext } from '@praha/diva';
 * import { mockContext } from '@praha/diva/test';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Set up mock
 * mockContext(withDatabase, () => new MockDatabase());
 *
 * // Now resolver returns mock without needing a provider
 * const db1 = database(); // Returns instance
 * const db2 = database(); // Returns same instance
 * ```
 *
 * @example
 * Mocking with a transient factory
 * ```ts
 * import { createContext } from '@praha/diva';
 * import { mockContext } from '@praha/diva/test';
 *
 * const [database, withDatabase] = createContext<Database>();
 *
 * // Set up transient mock
 * mockContext.transient(RequestIdProvider, () => new MockDatabase());
 *
 * // Each call creates a new value
 * const db1 = database(); // Returns instance
 * const db2 = database(); // Returns different instance
 * ```
 */
export type MockContext = {
  /**
   * Sets a scoped mock value on a provider.
   *
   * @typeParam T - The type of value provided by the context
   * @param provider - The provider to mock
   * @param builder - A function that creates the mock value (called once immediately)
   *
   * @remarks
   * The builder function is called immediately when setting up the mock,
   * and the returned value is cached. All subsequent calls to the resolver
   * will return the same cached mock value.
   */
  <T>(provider: Provider<T>, builder: () => T): void;

  /**
   * Sets a transient mock factory on a provider.
   *
   * @remarks
   * Unlike the default scoped behavior, transient stores the builder function
   * itself, which will be called on each resolution to create a new instance.
   */
  transient: {
    /**
     * Sets a transient mock factory on a provider.
     *
     * @typeParam T - The type of value provided by the context
     * @param provider - The provider to mock
     * @param builder - A function that creates mock values (called on each resolution)
     *
     * @remarks
     * The builder function is stored as-is and will be invoked each time
     * the resolver is called, allowing for dynamic mock values.
     */
    <T>(provider: Provider<T>, builder: () => T): void;
  };
};

export const mockContext: MockContext = (provider, builder) => {
  provider[Mock] = builder();
};

mockContext.transient = (provider, builder) => {
  provider[Mock] = builder;
};

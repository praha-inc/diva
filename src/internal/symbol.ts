/**
 * A unique symbol used as a key for storing mock values on context providers.
 *
 * @remarks
 * This symbol is used internally by the library to attach mock values or factory
 * functions to provider objects. It enables testing by allowing mock values to be
 * injected without requiring provider scopes.
 *
 * The symbol is used as a property key on Provider objects:
 * - When set to a value `T`, the resolver returns that value when no provider is active
 * - When set to a function `() => T`, the resolver calls it to get the value
 * - When set to `undefined`, the normal provider behavior is restored
 *
 * @internal This symbol is primarily for internal use and testing utilities.
 */
export const Mock = Symbol('di-container:mock');

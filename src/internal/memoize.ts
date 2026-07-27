/**
 * Wraps a function so its result is computed at most once and cached for subsequent calls.
 *
 * @typeParam T - The return type of the wrapped function
 * @param fn - The function to memoize
 * @returns A function that returns the cached result, computing it on the first call
 *
 * @internal This function is for internal use by the context management system.
 */
export const memoize = <T>(fn: () => T): () => T => {
  let cache: T;
  let initialized = false;

  return () => {
    if (!initialized) {
      cache = fn();
      initialized = true;
    }
    return cache;
  };
};

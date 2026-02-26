import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * A stack-based storage mechanism for managing context values in async execution flows.
 *
 * @typeParam T - The type of items stored in the stack
 *
 * @remarks
 * This class provides a thread-safe way to manage nested context scopes using Node.js's
 * AsyncLocalStorage. It maintains a stack of values that can be accessed and modified
 * within async execution contexts.
 *
 * The stack-based approach allows for:
 * - Nested provider scopes where inner scopes can access outer scopes
 * - Proper cleanup when exiting scopes using the Disposable pattern
 * - Async-safe context propagation across Promise boundaries
 *
 * Each provider push adds an item to the stack, and the resolver can pop items off
 * the stack (with automatic cleanup via Symbol.dispose).
 *
 * @internal This class is for internal use by the context management system.
 */
export class StackStorage<T> {
  /**
   * The underlying async local storage instance that maintains the stack per execution context.
   *
   * @remarks
   * AsyncLocalStorage ensures that each async execution context (e.g., different HTTP requests)
   * has its own isolated stack, preventing cross-contamination between concurrent operations.
   */
  private storage = new AsyncLocalStorage<T[]>();

  /**
   * Gets the current stack of items for this execution context.
   *
   * @returns An array representing the current stack, or an empty array if no context exists
   *
   * @remarks
   * This method retrieves the stack associated with the current async execution context.
   * If called outside any context (i.e., not within a `run` call), it returns an empty array.
   */
  getStack(): T[] {
    const stack = this.storage.getStore();
    return stack ?? [];
  }

  /**
   * Pops an item from the stack and wraps it with a Disposable interface for automatic cleanup.
   *
   * @returns The top item from the stack wrapped with Symbol.dispose, or undefined if stack is empty
   *
   * @remarks
   * This method pops the most recent item from the stack and wraps it with a disposable
   * interface. When the returned object is disposed (e.g., via `using` statement), the item
   * is automatically pushed back onto the stack.
   */
  getItem(): (T & Disposable) | undefined {
    const stack = this.getStack();
    const builder = stack.pop();
    return builder && Object.assign(builder, { [Symbol.dispose]: () => stack.push(builder) });
  }

  /**
   * Runs a function within a new context scope with an item added to the stack.
   *
   * @typeParam R - The return type of the function to execute
   * @param item - The item to add to the stack for this execution scope
   * @param fn - The function to execute within the new scope
   * @returns The result of executing fn
   *
   * @remarks
   * This method creates a new async execution context with the given item added to the stack.
   * The item remains available to `getStack()` and `getItem()` calls within `fn` and any
   * async operations it spawns.
   *
   * The stack is automatically restored to its previous state after `fn` completes,
   * regardless of whether it succeeds or throws an error.
   */
  run<R>(item: T, fn: () => R): R {
    return this.storage.run([...this.getStack(), item], fn);
  }
}

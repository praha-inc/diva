import { AsyncLocalStorage } from 'node:async_hooks';

export class StackStorage<T> {
  private storage = new AsyncLocalStorage<T[]>();

  getStack(): T[] {
    const stack = this.storage.getStore();
    return stack ?? [];
  }

  getItem(): (T & Disposable) | undefined {
    const stack = this.getStack();
    const builder = stack.pop();
    return builder && Object.assign(builder, { [Symbol.dispose]: () => stack.push(builder) });
  }

  run<R>(item: T, fn: () => R): R {
    return this.storage.run([...this.getStack(), item], fn);
  }
}

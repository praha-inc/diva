import { describe, expect, test } from 'vitest';

import { createContext } from '../index';
import { mockContext } from './index';

describe('mockContext', () => {
  class Counter {
    public current: number = 0;

    increment() {
      this.current++;
    }
  }

  const [counter, withCounter] = createContext<Counter>();

  test('should return the mocked instance', () => {
    const instance = new Counter();

    mockContext(withCounter, () => instance);

    expect(counter()).toBe(instance);
    expect(counter().current).toBe(0);
  });

  test('should return the same instance', () => {
    mockContext(withCounter, () => new Counter());

    const first = counter();
    const second = counter();

    expect(first).toBe(second);
  });

  test('should allow modifying the mocked instance', () => {
    mockContext(withCounter, () => new Counter());

    expect(counter().current).toBe(0);

    counter().increment();

    expect(counter().current).toBe(1);
  });

  describe('when using transient', () => {
    test('should return the mocked instance', () => {
      const instance = new Counter();
      mockContext.transient(withCounter, () => instance);

      expect(counter()).toBe(instance);
      expect(counter().current).toBe(0);
    });

    test('should return a new instance each time', () => {
      mockContext.transient(withCounter, () => new Counter());

      const first = counter();
      const second = counter();

      expect(first).not.toBe(second);
    });
  });
});

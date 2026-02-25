import { describe, expect, test, vi } from 'vitest';

import { createContext } from './index';

describe('createContext', () => {
  class Counter {
    constructor(
      public current: number = 0,
    ) {}

    increment() {
      this.current++;
    }
  }

  const counter = createContext<Counter>();

  describe('when context is not provided', () => {
    test('should throw an error', () => {
      expect(() => counter()).toThrow(Error);
    });

    describe('when required is set to false', () => {
      const counter = createContext<Counter>({ required: false });

      test('should return undefined', () => {
        expect(counter()).toBeUndefined();
      });
    });
  });

  describe('when context is provided', () => {
    const builder = vi.fn(() => new Counter());

    test('should return the provided context', () => {
      counter.scoped(builder, () => {
        expect(counter().current).toBe(0);
      });
    });

    test('should return the same context', () => {
      counter.scoped(builder, () => {
        const first = counter();
        const second = counter();

        expect(first).toBe(second);
        expect(builder).toBeCalledTimes(1);
      });
    });

    test('should override the outer context', () => {
      const outerBuilder = vi.fn(() => new Counter());
      const innerBuilder = vi.fn(() => new Counter());

      counter.scoped(outerBuilder, () => {
        const outer = counter();

        counter.scoped(innerBuilder, () => {
          const inner = counter();
          expect(inner).not.toBe(outer);
        });

        expect(counter()).toBe(outer);
      });
    });

    test('should return the outer context in the inner builder', () => {
      const outerBuilder = vi.fn(() => new Counter());
      const innerBuilder = vi.fn(() => counter());

      counter.scoped(outerBuilder, () => {
        const outer = counter();

        counter.scoped(innerBuilder, () => {
          const inner = counter();
          expect(inner).toBe(outer);
        });

        expect(counter()).toBe(outer);
      });
    });

    describe('when using curried form', () => {
      test('should return the provided context', () => {
        const run = counter.scoped(builder);

        run(() => {
          expect(counter().current).toBe(0);
        });
      });

      test('should return the same context', () => {
        const run = counter.scoped(builder);

        run(() => {
          const first = counter();
          const second = counter();

          expect(first).toBe(second);
          expect(builder).toBeCalledTimes(1);
        });
      });

      test('should override the outer context', () => {
        const outerBuilder = vi.fn(() => new Counter());
        const innerBuilder = vi.fn(() => new Counter());
        const runOuter = counter.scoped(outerBuilder);
        const runInner = counter.scoped(innerBuilder);

        runOuter(() => {
          const outer = counter();

          runInner(() => {
            const inner = counter();
            expect(inner).not.toBe(outer);
          });

          expect(counter()).toBe(outer);
        });
      });

      test('should return the outer context in the inner builder', () => {
        const outerBuilder = vi.fn(() => new Counter());
        const innerBuilder = vi.fn(() => counter());
        const runOuter = counter.scoped(outerBuilder);
        const runInner = counter.scoped(innerBuilder);

        runOuter(() => {
          const outer = counter();

          runInner(() => {
            const inner = counter();
            expect(inner).toBe(outer);
          });

          expect(counter()).toBe(outer);
        });
      });
    });
  });

  describe('when transient context is provided', () => {
    const builder = vi.fn(() => new Counter());

    test('should return the provided context', () => {
      counter.transient(builder, () => {
        expect(counter().current).toBe(0);
      });
    });

    test('should return a new context each time', () => {
      counter.transient(builder, () => {
        const first = counter();
        const second = counter();

        expect(first).not.toBe(second);
        expect(builder).toBeCalledTimes(2);
      });
    });

    test('should override the outer context', () => {
      const outerBuilder = vi.fn(() => new Counter());
      const innerBuilder = vi.fn(() => new Counter(10));

      counter.transient(outerBuilder, () => {
        expect(counter().current).toBe(0);

        counter.transient(innerBuilder, () => {
          expect(counter().current).toBe(10);
        });

        expect(counter().current).toBe(0);
      });
    });

    test('should return the outer context in the inner builder', () => {
      const outerBuilder = vi.fn(() => new Counter(1));
      const innerBuilder = vi.fn(() => new Counter(counter().current + 1));

      counter.transient(outerBuilder, () => {
        expect(counter().current).toBe(1);

        counter.transient(innerBuilder, () => {
          expect(counter().current).toBe(2);
        });

        expect(counter().current).toBe(1);
      });
    });

    describe('when using curried form', () => {
      test('should return the provided context', () => {
        const run = counter.transient(builder);

        run(() => {
          expect(counter().current).toBe(0);
        });
      });

      test('should return a new context each time', () => {
        const run = counter.transient(builder);

        run(() => {
          const first = counter();
          const second = counter();

          expect(first).not.toBe(second);
          expect(builder).toBeCalledTimes(2);
        });
      });

      test('should override the outer context', () => {
        const outerBuilder = vi.fn(() => new Counter());
        const innerBuilder = vi.fn(() => new Counter(10));
        const runOuter = counter.transient(outerBuilder);
        const runInner = counter.transient(innerBuilder);

        runOuter(() => {
          expect(counter().current).toBe(0);

          runInner(() => {
            expect(counter().current).toBe(10);
          });

          expect(counter().current).toBe(0);
        });
      });

      test('should return the outer context in the inner builder', () => {
        const outerBuilder = vi.fn(() => new Counter(1));
        const innerBuilder = vi.fn(() => new Counter(counter().current + 1));
        const runOuter = counter.transient(outerBuilder);
        const runInner = counter.transient(innerBuilder);

        runOuter(() => {
          expect(counter().current).toBe(1);

          runInner(() => {
            expect(counter().current).toBe(2);
          });

          expect(counter().current).toBe(1);
        });
      });
    });
  });

  describe('when both scoped and transient contexts are provided', () => {
    test('should use transient context in the scoped context', () => {
      const scoped = new Counter();
      const builder = () => new Counter();

      counter.scoped(() => scoped, () => {
        const scopedValue1 = counter();
        scopedValue1.increment();

        expect(scopedValue1).toBe(scoped);
        expect(scopedValue1.current).toBe(1);

        counter.transient(builder, () => {
          const transientValue1 = counter();
          const transientValue2 = counter();
          transientValue2.increment();

          expect(transientValue1).not.toBe(scoped);
          expect(transientValue2).not.toBe(scoped);
          expect(transientValue1).not.toBe(transientValue2);
          expect(transientValue1.current).toBe(0);
          expect(transientValue2.current).toBe(1);
        });

        const scopedValue2 = counter();

        expect(scopedValue2).toBe(scoped);
        expect(scopedValue2.current).toBe(1);
      });
    });

    test('should use scoped context in the transient context', () => {
      const scoped = new Counter();
      const builder = () => new Counter();

      counter.transient(builder, () => {
        const transientValue1 = counter();
        transientValue1.increment();

        expect(transientValue1).not.toBe(scoped);
        expect(transientValue1.current).toBe(1);

        counter.scoped(() => scoped, () => {
          const scopedValue1 = counter();
          const scopedValue2 = counter();

          expect(scopedValue1).toBe(scopedValue2);
          expect(scopedValue1).not.toBe(transientValue1);
          expect(scopedValue1.current).toBe(0);
        });

        const transientValue2 = counter();
        expect(transientValue2).not.toBe(scoped);
        expect(transientValue2.current).toBe(0);
      });
    });
  });
});

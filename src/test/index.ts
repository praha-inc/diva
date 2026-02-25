import { Mock } from '../internal/symbol';

import type { Context } from '../index';

export type MockContext = {
  <T>(context: Context<T>, builder: () => T): void;
  transient: <T>(context: Context<T>, builder: () => T) => void;
};

export const mockContext: MockContext = (context, builder) => {
  context[Mock] = builder();
};

mockContext.transient = (context, builder) => {
  context[Mock] = builder;
};

import { Mock } from '../internal/symbol';

import type { Provider } from '../index';

export type MockContext = {
  <T>(provider: Provider<T>, builder: () => T): void;
  transient: <T>(provider: Provider<T>, builder: () => T) => void;
};

export const mockContext: MockContext = (provider, builder) => {
  provider[Mock] = builder();
};

mockContext.transient = (provider, builder) => {
  provider[Mock] = builder;
};

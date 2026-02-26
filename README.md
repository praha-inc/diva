# 🎵 @praha/diva

[![npm version](https://badge.fury.io/js/@praha%2Fdiva.svg)](https://www.npmjs.com/package/@praha/diva)
[![npm download](https://img.shields.io/npm/dm/@praha/diva.svg)](https://www.npmjs.com/package/@praha/diva)
[![license](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/praha-inc/diva/blob/main/LICENSE)
[![Github](https://img.shields.io/github/followers/praha-inc?label=Follow&logo=github&style=social)](https://github.com/orgs/praha-inc/followers)

**@praha/diva** is a lightweight, type-safe dependency injection library for TypeScript.
It provides a simple API for managing dependencies through context-based providers.

### Installation

```bash
npm install @praha/diva
```

### Usage

Create a context using `createContext()` which returns a tuple of `[Resolver, Provider]`:

```ts
import { createContext } from '@praha/diva';

// Create a context
const [database, withDatabase] = createContext<Database>();

// Provide a value within a scope
withDatabase(() => new Database(), () => {
  const db = database(); // Returns the Database instance
  db.query('SELECT * FROM users');
});
```

#### Transient mode

By default, providers cache the built value:

```ts
withDatabase(() => new Database(), () => {
  const db1 = database(); // New instance created
  const db2 = database(); // Same instance (cached)
  console.log(db1 === db2); // true
});
```

Use `transient` for a new instance on each resolution:

```ts
withDatabase.transient(() => new Database(), () => {
  const db1 = database(); // New instance
  const db2 = database(); // Different instance
  console.log(db1 === db2); // false
});
```

#### Curried Form

Providers support curried invocation for better reusability:

```ts
const [logger, withLogger] = createContext<Logger>();

// Create a reusable scoped function
const runWithLogger = withLogger(() => new ConsoleLogger());

runWithLogger(() => {
  logger().info('Hello, world!');
});
```

#### Optional Contexts

Create optional contexts that return `undefined` when not provided:

```ts
const [config, withConfig] = createContext<Config>({ required: false });

// Outside provider scope - returns undefined instead of throwing
const maybeConfig = config(); // undefined
```

#### Composing Multiple Contexts

Use `withContexts()` to compose multiple context providers:

```ts
import { createContext, withContexts } from '@praha/diva';

const [database, withDatabase] = createContext<Database>();
const [logger, withLogger] = createContext<Logger>();
const [auth, withAuth] = createContext<Auth>();

withContexts([
  withDatabase(() => new Database()),
  withLogger(() => new Logger()),
  withAuth(() => new Auth()),
], () => {
  // All contexts are available here
});
```

#### Testing with Mocks

Use `mockContext` from `@praha/diva/test` to inject mock values in tests:

```typescript
import { createContext } from '@praha/diva';
import { mockContext } from '@praha/diva/test';

const [database, withDatabase] = createContext<Database>();

// Set up a scoped mock
mockContext(withDatabase, () => new MockDatabase());

// Now resolver returns mock without needing a provider
const db = database(); // Returns MockDatabase instance

// Transient mocks create new instances each time
mockContext.transient(withDatabase, () => new MockDatabase());
const db1 = database(); // New instance
const db2 = database(); // Different instance
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome.

Feel free to check [issues page](https://github.com/praha-inc/diva/issues) if you want to contribute.

## 📝 License

Copyright © [PrAha, Inc.](https://www.praha-inc.com/)

This project is [```MIT```](https://github.com/praha-inc/diva/blob/main/LICENSE) licensed.

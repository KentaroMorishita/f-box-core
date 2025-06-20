# F-Box Core

[![npm version](https://badge.fury.io/js/f-box-core.svg)](https://badge.fury.io/js/f-box-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**F-Box Core** is a TypeScript library for function composition. It provides five types—`Box`, `RBox`, `Maybe`, `Either`, and `Task`—that help you build complex operations by combining small functions.

## Features

- **Function Composition**: Combine small functions to build complex operations
- **Operator Chaining**: Use `<$>`, `<*>`, `>>=` for value transformation, combination, and chaining
- **Type Safety**: Eliminate null reference exceptions and runtime errors
- **Lightweight**: Zero dependencies, small library
- **Consistent API**: Unified operations across all types

## Installation

```bash
npm install f-box-core
```

## Why F-Box?

| Type     | Use Case | Description                                                                                    |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `Box`    | **Function Composition** | Simple container for values with functional transformations |
| `RBox`   | **State Management** | Reactive container with subscription-based updates |
| `Maybe`  | **Null Safety** | Optional values that eliminate null/undefined errors |
| `Either` | **Error Handling** | Computations that can succeed (`Right`) or fail (`Left`) |
| `Task`   | **Async Operations** | Composable asynchronous computations |

## Basic Usage

F-Box types provide methods and operators for combining functions to build operations:

```typescript
import { Maybe } from "f-box-core";

// Handle values that might be null safely
const user = { name: "Alice", email: null };

const result = Maybe.pack(user.email)
  ["<$>"]((email) => email.toLowerCase())  // Convert to lowercase if email is not null
  ["<$>"]((email) => `Email: ${email}`)    // Add message
  ["<|>"]("No email address set");         // Get value or default (alias for getOrElse)

console.log(result); // "No email address set"
```

### Real-world Example: User Registration with Error Handling

```typescript
const registerUser = (userInput: any) =>
  validateEmail(userInput.email)
    [">>="](((email) => validatePassword(userInput.password)
      ["<$>"]((password) => ({ email, password }))))
    [">>="](createUser)
    [">>="](((user) => generateToken(user.id)
      ["<$>"]((token) => ({ user, token }))));

// If any step fails, the entire computation short-circuits
registerUser(userData).match(
  (error) => console.error("Registration failed:", error),
  (result) => console.log("User registered:", result)
);
```

## Core Operators

F-Box uses three main operators for function composition:

| Operator | Name           | Description                                                                                                                       |
| -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<$>`    | Map            | Transforms the value inside the container.                                  |
| `<*>`    | Apply          | Applies a wrapped function to a wrapped value.                               |
| `>>=`    | FlatMap (Bind) | Chains computations while flattening results. |

### Operator Usage Examples

#### `<$>` - Map

Applies a function to the value inside the container.

```typescript
import { Box } from "f-box-core";

const box = Box.pack(5);
const result = box["<$>"]((x) => x * 2);
console.log(result.getValue()); // Outputs: 10
```

#### `<*>` - Apply

Allows applying a function wrapped in a container to a value wrapped in another container.

```typescript
import { Box } from "f-box-core";

const boxFn = Box.pack((x: number) => x + 3);
const boxValue = Box.pack(7);

const result = boxFn["<*>"](boxValue);
console.log(result.getValue()); // Outputs: 10
```

#### `>>=` - FlatMap

Chains computations while handling the context.

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("Division by zero") : Either.right(a / b);

const result = Either.right(10)
  [">>="](((x) => divide(x, 2)))
  [">>="](((x) => divide(x, 5)));

console.log(result["<|>"](0)); // Outputs: 1
```

## Quick Start Guide

### When to Use Each Type

| Scenario | Recommended Type | Why? |
|----------|------------------|------|
| Simple data transformation | `Box` | Pure functional composition |
| React/Vue state management | `RBox` | Built-in reactivity and observers |
| API responses that might be null | `Maybe` | Eliminates null/undefined errors |
| Operations that can fail | `Either` | Explicit error handling |
| Async operations | `Task` | Composable promise-like behavior |

## Detailed Usage

### Box - Function Composition

A container for encapsulating values, enabling functional transformations with `map`, `flatMap`, and more.

#### Basic Example

```typescript
import { Box } from "f-box-core";

// Operator chaining for value transformation
const result = Box.pack(10)
  ["<$>"]((x) => x * 2)    // 10 → 20
  ["<$>"]((x) => x + 5);   // 20 → 25

console.log(result.getValue()); // Outputs: 25

// Combining multiple Boxes
const add = (x: number) => (y: number) => x + y;
const multiply = (x: number) => (y: number) => x * y;

const calculation = Box.pack(add)
  ["<*>"](Box.pack(10))   // apply add(10)
  ["<*>"](Box.pack(5));   // add(10)(5) → 15

console.log(calculation.getValue()); // Outputs: 15
```

#### Real-world Example: Data Processing Pipeline

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

const normalizeUser = (user: User): User => ({
  ...user,
  name: user.name.charAt(0).toUpperCase() + user.name.slice(1),
  email: user.email.toLowerCase()
});

const validateAge = (user: User): User | null =>
  user.age >= 18 ? user : null;

// Operator chaining for processing pipeline
const processUser = Box.pack({ name: "alice", age: 25, email: "ALICE@EXAMPLE.COM" })
  ["<$>"](normalizeUser)     // Normalize name and email
  ["<$>"](validateAge)       // Validate age
  [">>="](((user) => user ? Box.pack(user) : Box.pack(null)));

console.log(processUser.getValue()); // { name: "Alice", age: 25, email: "alice@example.com" }
```

### RBox - Reactive State Management

A reactive container for managing state, ideal for applications requiring reactivity like React or Vue.

#### Basic Example

```typescript
import { RBox } from "f-box-core";

const counter = RBox.pack(0);

// Subscribe to changes
counter.subscribe((value) => console.log(`Counter: ${value}`));

// Update the value
counter.setValue(1); // Outputs: "Counter: 1"
counter.setValue((prev) => prev + 5); // Outputs: "Counter: 6"
```

#### Real-world Example: Reactive Shopping Cart

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const cart = RBox.pack<CartItem[]>([]);

// Operator chaining for derived values
const cartTotal = cart["<$>"]((items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const cartCount = cart["<$>"]((items) => items.length);

const cartSummary = cart
  ["<$>"]((items) => items.length)
  [">>="](((count) => cartTotal["<$>"]((total) => ({ count, total }))));

// Subscribe to reactive changes
cart.subscribe((items) => console.log(`Cart items: ${items.length}`));
cartTotal.subscribe((total) => console.log(`Total: ¥${total.toLocaleString()}`));

// State updates
cart.setValue((prev) => [
  ...prev,
  { id: "1", name: "Laptop", price: 128000, quantity: 1 }
]);
```

### Maybe - Null Safety

Represents optional values, preventing `null` or `undefined` errors with a `Just` or `Nothing` abstraction.

#### Basic Example

```typescript
import { Maybe } from "f-box-core";

// Safe value handling
const safeValue = Maybe.pack("hello");
const nullValue = Maybe.pack(null);

const result1 = safeValue["<$>"]((s) => s.toUpperCase())["<|>"]("DEFAULT");
const result2 = nullValue["<$>"]((s) => s.toUpperCase())["<|>"]("DEFAULT");

console.log(result1); // "HELLO"
console.log(result2); // "DEFAULT"
```

#### Real-world Example: Safe API Data Processing

```typescript
interface UserProfile {
  id: number;
  name?: string;
  avatar?: string;
  bio?: string;
}

// Operator chaining for processing
const getUserDisplayName = (profile: UserProfile) =>
  Maybe.pack(profile.name)
    [">>="]((name: string) => Maybe.pack(profile.bio)
      [">>="]((bio: string) => {
        const cleanName = name.trim();
        const displayName = cleanName.length > 0 ? cleanName : "Anonymous";
        return Maybe.pack(`${displayName} - ${bio}`);
      }))
    ["<|>"]("Guest"); // Get value or default (alias for getOrElse)

// Do notation for the same processing (simple string types only)
const getUserDisplayNameDo = (profile: UserProfile) =>
  Maybe.do<string, string>(function*() {
    const name = yield Maybe.pack(profile.name);
    const bio = yield Maybe.pack(profile.bio);
    const cleanName = name.trim();
    const displayName = cleanName.length > 0 ? cleanName : "Anonymous";
    return `${displayName} - ${bio}`;
  })["<|>"]("Guest"); // Get value or default

// For complex cases with different types, operator chaining is often clearer

// Applicative style for combining multiple values
const processUserProfile2 = (profile: UserProfile) => {
  const createProfile = (name: string) => (avatar: string) => (bio: string) => ({
    displayName: name.length > 0 ? name : "Anonymous",
    profileImage: avatar,
    description: bio.substring(0, 100)
  });

  return Maybe.pack(createProfile)
    ["<*>"](Maybe.pack(profile.name))
    ["<*>"](Maybe.pack(profile.avatar))
    ["<*>"](Maybe.pack(profile.bio));
};

const user = { id: 1, name: "Alice", avatar: "avatar.jpg", bio: "Software developer" };
const processed = processUserProfile(user);
const processedDo = processUserProfileDo(user);

console.log("Profile (operator):", processed);
console.log("Profile (do notation):", processedDo);

// Note: Do notation works best for sequential operations with the same type.
// For complex nested operations with different types, operator chaining is often more practical.
```

### Either - Error Handling

Encapsulates computations that may succeed (`Right`) or fail (`Left`).

#### Basic Example

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("Division by zero") : Either.right(a / b);

// Traditional chaining
const result = divide(10, 2)
  ["<$>"]((x) => x * 3)
  ["<|>"](0);

console.log(result); // 15

// Operator chaining for complex calculations
const calculation = divide(10, 2)
  [">>="](((x) => divide(x, 5)))
  [">>="](((y) => divide(100, y)))
  ["<$>"]((z) => z * 2);

calculation.match(
  (error) => console.error("Error:", error),
  (result) => console.log("Result:", result) // "Result: 200"
);
```

#### Real-world Example: Form Validation

```typescript
interface User {
  email: string;
  password: string;
  age: number;
}

const validateEmail = (email: string): Either<string, string> =>
  email.includes("@")
    ? Either.right(email)
    : Either.left("Invalid email format");

const validatePassword = (password: string): Either<string, string> =>
  password.length >= 8
    ? Either.right(password)
    : Either.left("Password must be at least 8 characters");

const validateAge = (age: number): Either<string, number> =>
  age >= 18
    ? Either.right(age)
    : Either.left("Must be at least 18 years old");

// Applicative style validation (processes all errors)
const validateUserApplicative = (data: any): Either<string[], User> => {
  const createUser = (email: string) => (password: string) => (age: number) => ({ email, password, age });

  return Either.pack(createUser)
    ["<*>"](validateEmail(data.email)["<$>"](email => [email]))
    ["<*>"](validatePassword(data.password)["<$>"](password => [password]))
    ["<*>"](validateAge(data.age)["<$>"](age => [age]));
};

// Chain style validation (stops at first error)
const validateUser = (data: any): Either<string, User> =>
  validateEmail(data.email)
    [">>="](email => validatePassword(data.password)
      [">>="](password => validateAge(data.age)
        ["<$>"](age => ({ email, password, age }))));

// Usage
const userData = { email: "user@example.com", password: "secretpassword", age: 25 };
const validationResult = validateUser(userData);

validationResult.match(
  (error) => console.error("Validation failed:", error),
  (user) => console.log("Valid user:", user)
);
```

### Task - Asynchronous Operations

Manages asynchronous computations in a composable and functional way.

#### Basic Example

```typescript
import { Task } from "f-box-core";

// Simple async operation
const fetchData = Task.from(() =>
  fetch("https://api.example.com/data").then(res => res.json())
);

// Chain operations
const processedData = fetchData
  ["<$>"]((data) => data.map(item => item.name))
  ["<$>"]((names) => names.filter(name => name.length > 3));

processedData.run().then(console.log);
```

#### Real-world Example: Async Data Processing

```typescript
interface User { id: number; name: string; }

const fetchUser = (id: number): Task<User> =>
  Task.from(() => fetch(`/api/users/${id}`).then(res => res.json()));

const fetchUserProfile = (userId: number): Task<string> =>
  Task.from(() => fetch(`/api/users/${userId}/profile`).then(res => res.text()));

// Break processing into small functions
const getProfile = (user: User) => fetchUserProfile(user.id);
const formatProfile = (profile: string) => `Profile: ${profile}`;

// Compose functions simply by passing them directly
const getUserInfo = (userId: number) =>
  fetchUser(userId)
    [">>="](getProfile)
    ["<$>"](formatProfile);

// Usage
await getUserInfo(123)
  .run()
  .then(result => console.log(result)) // "Profile: ..."
  .catch(error => console.error("Error:", error));
```

## Additional Operators

Beyond the core operators, F-Box types also provide utility operators:

| Operator | Purpose | Description |
|----------|---------|-------------|
| `<?>` | Alternative | Returns alternative value if current is invalid (alias for `orElse`) |
| `<|>` | Default | Gets value or returns default (alias for `getOrElse`) |

## Advanced Features

### Error Recovery Patterns

```typescript
// Retry with exponential backoff
const retryTask = <T>(task: Task<T>, maxRetries: number = 3): Task<T> => {
  const attempt = (retriesLeft: number): Task<T> =>
    Task.tryCatch(
      () => task.run(),
      (error) => {
        if (retriesLeft <= 0) throw error;
        const delay = Math.pow(2, maxRetries - retriesLeft) * 1000;
        return new Promise(resolve =>
          setTimeout(() => resolve(attempt(retriesLeft - 1).run()), delay)
        );
      }
    );

  return attempt(maxRetries);
};
```

### Combining Multiple Types

```typescript
// Reactive form validation
const createReactiveForm = () => {
  const email = RBox.pack("");
  const password = RBox.pack("");

  // Real-time validation with operator chaining
  const emailValidation = email["<$>"](validateEmail);
  const passwordValidation = password["<$>"](validatePassword);

  // Combine multiple validation results
  const formValid = emailValidation
    [">>="](((emailResult) => passwordValidation
      ["<$>"]((passwordResult) =>
        emailResult.isRight && passwordResult.isRight)));

  return { email, password, emailValidation, passwordValidation, formValid };
};

// Either and Task combination
const authenticateUser = (credentials: LoginData) =>
  Task.from(() => Promise.resolve(validateCredentials(credentials)))
    [">>="](((validationResult) =>
      validationResult.isRight
        ? Task.from(() => loginAPI(validationResult.getValue()))
        : Task.pack(Either.left(validationResult.getValue()))));
```

## Performance & Bundle Size

- **Zero dependencies**: Pure TypeScript implementation
- **Tree-shakeable**: Import only what you need
- **Lightweight**: ~5KB gzipped for the entire library
- **Type-safe**: Full TypeScript support with strict typing

## Contributing

Pull requests and issue reports are welcome.

### Development Environment Setup

```bash
# Clone the repository
git clone https://github.com/KentaroMorishita/f-box-core.git
cd f-box-core

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev      # Start Vite development server
npm run build    # Build the library
npm run lint     # TypeScript type checking
npm test         # Run tests with Vitest in watch mode
npm run coverage # Run tests with coverage report
```

### Testing

- Framework: Vitest
- Environment: jsdom
- Run specific tests: `npm test -- Box.test.ts`

## Support

- [GitHub Issues](https://github.com/KentaroMorishita/f-box-core/issues) - Bug reports and feature requests
- [F-Box React](https://github.com/KentaroMorishita/f-box-react) - React hooks and utilities

## License

MIT License - See the [LICENSE](./LICENSE) file for details.
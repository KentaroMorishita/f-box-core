# F-Box

**F-Box** is a powerful utility library for functional programming in TypeScript. It provides five core monad abstractions—`Box`, `RBox`, `Maybe`, `Either`, and `Task`—to simplify handling values with contexts, side effects, and asynchronous computations.

## Why F-Box?

- **Do Notation Support**: Write clean, imperative-style code with generator functions
- **Type Safety**: Eliminate null pointer exceptions and runtime errors
- **Performance**: Lightweight and efficient functional abstractions
- **Practical**: Designed for real-world TypeScript applications
- **Mathematical Foundation**: Based on category theory (Functor, Applicative, Monad laws)

| Type     | Use Case | Description                                                                                    |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `Box`    | **Function Composition** | Simple container for values with functional transformations |
| `RBox`   | **State Management** | Reactive container with subscription-based updates |
| `Maybe`  | **Null Safety** | Optional values that eliminate null/undefined errors |
| `Either` | **Error Handling** | Computations that can succeed (`Right`) or fail (`Left`) |
| `Task`   | **Async Operations** | Composable asynchronous computations |

## Do Notation

F-Box's **Do notation** allows you to write sequential, imperative-style code while maintaining all the benefits of functional programming:

```typescript
// Traditional functional style
const traditional = Maybe.just(10)
  [">>="]((x) => Maybe.just(x * 2))
  [">>="]((x) => Maybe.just(x + 5))
  ["<$>"]((x) => `Result: ${x}`);

// Do notation - cleaner and more readable
const withDo = Maybe.do(function*() {
  const x = yield Maybe.just(10);
  const doubled = yield Maybe.just(x * 2);
  const added = yield Maybe.just(doubled + 5);
  return `Result: ${added}`;
});
```

### Real-world Example: User Registration

```typescript
const registerUser = Either.do(function*() {
  const email = yield validateEmail(userInput.email);
  const password = yield validatePassword(userInput.password);
  const user = yield createUser({ email, password });
  const token = yield generateToken(user.id);
  return { user, token };
});

// If any step fails, the entire computation short-circuits
registerUser.match(
  (error) => console.error("Registration failed:", error),
  (result) => console.log("User registered:", result)
);
```

## Installation

Install via npm:

```bash
npm install f-box-core
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

// Traditional approach
const result = Box.pack(10)
  ["<$>"]((x) => x * 2)
  ["<$>"]((x) => x + 5);

console.log(result.getValue()); // Outputs: 25

// Do notation approach
const doResult = Box.do(function*() {
  const x = yield Box.pack(10);
  const doubled = x * 2;
  const final = doubled + 5;
  return final;
});

console.log(doResult.getValue()); // Outputs: 25
```

#### Real-world Example: Data Processing Pipeline

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

const processUser = Box.do(function*() {
  const userData = yield Box.pack({ name: "alice", age: 25, email: "ALICE@EXAMPLE.COM" });
  const normalized = {
    ...userData,
    name: userData.name.charAt(0).toUpperCase() + userData.name.slice(1),
    email: userData.email.toLowerCase()
  };
  const validated = normalized.age >= 18 ? normalized : null;
  return validated;
});

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

#### Real-world Example: React-like State Management

```typescript
// Shopping cart state
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const cart = RBox.pack<CartItem[]>([]);
const cartTotal = cart["<$>"]((items) => 
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// Subscribe to cart changes
cart.subscribe((items) => console.log(`Cart has ${items.length} items`));
cartTotal.subscribe((total) => console.log(`Total: $${total.toFixed(2)}`));

// Add items
cart.setValue((prev) => [
  ...prev,
  { id: "1", name: "Laptop", price: 999.99, quantity: 1 }
]);
// Outputs: "Cart has 1 items" and "Total: $999.99"
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

const processUserProfile = (profile: UserProfile) => Maybe.do(function*() {
  const name = yield Maybe.pack(profile.name);
  const avatar = yield Maybe.pack(profile.avatar);
  const bio = yield Maybe.pack(profile.bio);
  
  return {
    displayName: name.length > 0 ? name : "Anonymous",
    profileImage: avatar,
    description: bio.substring(0, 100)
  };
});

const user = { id: 1, name: "Alice", bio: "Software developer" };
const processed = processUserProfile(user);

processed.match(
  () => console.log("Profile incomplete"),
  (profile) => console.log("Profile:", profile)
);
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

// Do notation for complex operations
const calculation = Either.do(function*() {
  const x = yield divide(10, 2); // 5
  const y = yield divide(x, 5);  // 1
  const z = yield divide(100, y); // 100
  return z * 2; // 200
});

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

const validateUser = (data: any): Either<string, User> => Either.do(function*() {
  const email = yield validateEmail(data.email);
  const password = yield validatePassword(data.password);
  const age = yield validateAge(data.age);
  
  return { email, password, age };
});

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

#### Real-world Example: Multi-step API Workflow

```typescript
interface User { id: number; name: string; email: string; }
interface Post { id: number; userId: number; title: string; content: string; }
interface Comment { id: number; postId: number; text: string; }

const fetchUser = (id: number): Task<User> =>
  Task.from(() => fetch(`/api/users/${id}`).then(res => res.json()));

const fetchUserPosts = (userId: number): Task<Post[]> =>
  Task.from(() => fetch(`/api/users/${userId}/posts`).then(res => res.json()));

const fetchPostComments = (postId: number): Task<Comment[]> =>
  Task.from(() => fetch(`/api/posts/${postId}/comments`).then(res => res.json()));

// Complex workflow with Do notation
const getUserDashboard = (userId: number) => Task.do(function*() {
  const user = yield fetchUser(userId);
  const posts = yield fetchUserPosts(user.id);
  
  // Fetch comments for all posts in parallel
  const commentsPromises = posts.map(post => fetchPostComments(post.id));
  const allComments = yield Task.from(() => Promise.all(
    commentsPromises.map(task => task.run())
  ));
  
  return {
    user,
    posts: posts.map((post, index) => ({
      ...post,
      comments: allComments[index]
    }))
  };
});

// Usage with error handling
const dashboard = Task.tryCatch(
  () => getUserDashboard(123).run(),
  (error) => {
    console.error("Failed to load dashboard:", error);
    return { user: null, posts: [] };
  }
);

dashboard.run().then(data => {
  console.log("Dashboard loaded:", data);
});
```

## Supported Operators

Operators like `<$>`, `<*>`, and `>>=` are designed to make functional programming intuitive, allowing you to compose, transform, and chain operations seamlessly.

| Operator | Name           | Description                                                                                                                       |
| -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<$>`    | Map            | Transforms the value inside the container. Useful for applying functions to encapsulated values.                                  |
| `<*>`    | Apply          | Applies a wrapped function to a wrapped value. Useful for computations involving multiple contexts.                               |
| `>>=`    | FlatMap (Bind) | Chains computations while flattening results. Useful for dependent computations where the result of one step influences the next. |

---

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
  [">>="]((x) => divide(x, 2))
  [">>="]((x) => divide(x, 5));

console.log(result.getOrElse(0)); // Outputs: 1
```

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
// Reactive form with validation
const createReactiveForm = () => {
  const email = RBox.pack("");
  const password = RBox.pack("");
  
  const emailValidation = email["<$>"](validateEmail);
  const passwordValidation = password["<$>"](validatePassword);
  
  const formValid = RBox.pack(false);
  
  // Update form validity when fields change
  const updateValidity = () => {
    const isEmailValid = emailValidation.getValue().isRight;
    const isPasswordValid = passwordValidation.getValue().isRight;
    formValid.setValue(isEmailValid && isPasswordValid);
  };
  
  email.subscribe(updateValidity);
  password.subscribe(updateValidity);
  
  return { email, password, emailValidation, passwordValidation, formValid };
};
```

## Performance & Bundle Size

- **Zero dependencies**: Pure TypeScript implementation
- **Tree-shakeable**: Import only what you need
- **Lightweight**: ~5KB gzipped for the entire library
- **Type-safe**: Full TypeScript support with strict typing

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

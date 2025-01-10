# F-Box

**F-Box** is a utility library for functional programming in TypeScript. It provides abstractions such as `Box`, `RBox`, `Maybe`, `Either`, and `Task` to simplify handling values with contexts, side effects, and asynchronous computations.

| Type     | Description                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------- |
| `Box`    | Represents a simple container for a value, supporting functional transformations and chaining. |
| `RBox`   | A reactive version of `Box` that supports reactivity and state management.                     |
| `Maybe`  | Represents a value that may or may not exist (`Just` or `Nothing`).                            |
| `Either` | Represents a value that is either an error (`Left`) or a valid result (`Right`).               |
| `Task`   | Represents an asynchronous computation that produces a result.                                 |

---

## Installation

Install via npm:

```bash
npm install f-box-core
```

---

## Usage

### Box

A container for encapsulating values, enabling functional transformations with `map`, `flatMap`, and more.

#### Example

```typescript
import { Box } from "f-box-core";

const result = Box.pack(10)
  ["<$>"]((x) => x * 2)
  ["<$>"]((x) => x + 5);

console.log(result.getValue()); // Outputs: 25
```

---

### RBox

A reactive container for managing state, ideal for applications requiring reactivity like React or Vue.

#### Example

```typescript
import { RBox } from "f-box-core";

const state = RBox.pack(0);

state.subscribe(console.log); // Outputs: 1
state.setValue(1);
```

---

### Maybe

Represents optional values, preventing `null` or `undefined` errors with a `Just` or `Nothing` abstraction.

#### Example

```typescript
import { Maybe } from "f-box-core";

const result = Maybe.just(42)
  ["<$>"]((x) => x * 2) // map
  ["<|>"](0); // getOrElse

console.log(result); // Outputs: 84
```

---

### Either

Encapsulates computations that may succeed (`Right`) or fail (`Left`).

#### Example

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("Division by zero") : Either.right(a / b);

const result = divide(10, 2)
  ["<$>"]((x) => x * 3) // map
  ["<|>"](0); // getOrElse

console.log(result); // Outputs: 15
```

---

### Task

Manages asynchronous computations in a composable and functional way.

#### Example

```typescript
import { Task } from "f-box-core";

const apiUrl = "https://jsonplaceholder.typicode.com/posts";

type Post = { id: number; title: string; body: string };

const fetchPost = (id: number) =>
  Task.from<Post>(() =>
    fetch(`${apiUrl}/${id}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch post with ID ${id}`);
      }
      return response.json();
    })
  );

const safeFetchPost = (id: number) =>
  Task.tryCatch<Post>(
    () => fetchPost(id).run(),
    (error) => {
      console.error(`Error: ${error.message}`);
      return { id, title: "Fallback title", body: "No content available" };
    }
  );

Task.pack(1)
  [">>="](safeFetchPost)
  ["<$>"]((post) => `Post title: ${post.title}`)
  .run() // fetchPost is called here
  .then((message) => console.log(message));
```

---

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

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

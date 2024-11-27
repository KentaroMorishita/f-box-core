# F-Box

**F-Box** is a utility library for functional programming in TypeScript. It provides abstractions such as `Box`, `RBox`, `Maybe`, `Either`, and `Task` to simplify handling values with contexts, side effects, and asynchronous computations.

**F-Box**は、TypeScript における関数型プログラミング向けのユーティリティライブラリです。`Box`、`RBox`、`Maybe`、`Either`、`Task`といった抽象化を提供し、文脈を持つ値、副作用、非同期計算の取り扱いを簡素化します。

| Type     | Description                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Box`    | Represents a simple container for a value, supporting functional transformations and chaining. / 値を包むシンプルなコンテナで、関数型の変換や連結をサポートします。 |
| `RBox`   | A reactive version of `Box` that supports reactivity and state management. / 状態管理とリアクティビティをサポートする`Box`のリアクティブ版です。                    |
| `Maybe`  | Represents a value that may or may not exist (`Just` or `Nothing`). / 値が存在するかしないかを表現する型（`Just` または `Nothing`）。                               |
| `Either` | Represents a value that is either an error (`Left`) or a valid result (`Right`). / エラー（`Left`）または有効な結果（`Right`）を表す型。                            |
| `Task`   | Represents an asynchronous computation that produces a result. / 非同期の計算を表現し、結果を生成する型。                                                           |

---

## Installation

Install via npm:

```sh
npm install f-box-core
```

---

## Usage

### Box

A container for encapsulating values, enabling functional transformations with `map`, `flatMap`, and more.

値をカプセル化し、`map`や`flatMap`などでの関数的な変換を可能にするコンテナです。

#### Example

```typescript
import { Box } from "f-box-core";

const value = Box.pack(10);
const result = value["<$>"]((x) => x * 2)["<$>"]((x) => x + 5);

console.log(result.getValue()); // Outputs: 25
```

---

### RBox

A reactive container for managing state, ideal for applications requiring reactivity like React or Vue.

リアクティブな状態管理用コンテナで、React や Vue のようなリアクティブ性を必要とするアプリケーションに最適です。

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

オプショナルな値を表現し、`Just`または`Nothing`の抽象化によって`null`や`undefined`のエラーを防ぎます。

#### Example

```typescript
import { Maybe } from "f-box-core";

const maybeValue = Maybe.just(42);
const result = maybeValue["<$>"]((x) => x * 2).getOrElse(0);

console.log(result); // Outputs: 84
```

---

### Either

Encapsulates computations that may succeed (`Right`) or fail (`Left`).

成功（`Right`）または失敗（`Left`）する可能性のある計算をカプセル化します。

#### Example

```typescript
import { Either } from "f-box-core";

const divide = (a: number, b: number): Either<string, number> =>
  b === 0 ? Either.left("Division by zero") : Either.right(a / b);

const result = divide(10, 2)
  ["<$>"]((x) => x * 3)
  .getOrElse(0);

console.log(result); // Outputs: 15
```

---

### Task

Handles asynchronous computations while maintaining functional style.

非同期計算を扱いつつ、関数型のスタイルを維持します。

#### Example

```typescript
import { Task } from "f-box-core";

const asyncTask = Task.pack(() => Promise.resolve(10));

asyncTask["<$>"]((x) => x * 2)
  .run()
  .then((result) => {
    console.log(result); // Outputs: 20
  });
```

---

## Supported Operators

Operators like `<$>`, `<*>`, and `>>=` are designed to make functional programming intuitive, allowing you to compose, transform, and chain operations seamlessly.

`<$>`、`<*>`、`>>=`のような演算子は、関数型プログラミングを直感的にし、操作の合成、変換、および連結をシームレスに行えるように設計されています。

| Operator | Name           | Description                                                                             |
| -------- | -------------- | --------------------------------------------------------------------------------------- |
| `<$>`    | Map            | Transforms the value inside the container. Useful for applying functions to encapsulated values. / コンテナ内の値を変換します。カプセル化された値に関数を適用するのに便利です。 |
| `<*>`    | Apply          | Applies a wrapped function to a wrapped value. Useful for computations involving multiple contexts. / 包まれた関数を包まれた値に適用します。複数の文脈を持つ計算に便利です。 |
| `>>=`    | FlatMap (Bind) | Chains computations while flattening results. Useful for dependent computations where the result of one step influences the next. / 計算を連結し、結果を平坦化します。ある計算の結果が次のステップに影響する依存型計算に便利です。 |

---

### Operator Usage Examples

#### `<$>` - Map

**What it does:**

Applies a function to the value inside the container. This is particularly useful when you want to modify or transform the encapsulated value without unwrapping it.

**用途:**

コンテナ内の値に関数を適用します。値を取り出さずに変換や加工を行いたい場合に便利です。

```typescript
import { Box } from "f-box-core";

const box = Box.pack(5);
const result = box["<$>"]((x) => x * 2);
console.log(result.getValue()); // Outputs: 10
```

#### `<*>` - Apply

**What it does:**

Allows applying a function wrapped in a container to a value wrapped in another container. This is useful in scenarios where both the function and the value are produced in separate contexts (e.g., computations or asynchronous tasks).

**用途:**

包まれた関数を包まれた値に適用します。関数と値がそれぞれ異なる文脈で生成される場合（例：計算や非同期タスク）に便利です。

```typescript
import { Box } from "f-box-core";

const boxFn = Box.pack((x: number) => x + 3);
const boxValue = Box.pack(7);

const result = boxFn["<*>"](boxValue);
console.log(result.getValue()); // Outputs: 10
```

#### `>>=` - FlatMap

**What it does:**

Chains computations while handling the context. This is essential when the result of one computation determines the next step, such as when working with asynchronous tasks, error handling, or computations that may produce no result.

**用途:**

文脈を維持しながら計算を連結します。例えば、非同期タスク、エラー処理、結果が存在しない可能性のある計算を扱う場合に役立ちます。

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
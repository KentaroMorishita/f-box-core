/**
 * Represents an asynchronous computation that produces a value of type `T`.
 * 非同期の計算を表し、型 `T` の値を生成します。
 */
export type Task<T> = {
  readonly isTask: true; // Identifies the object as a `Task`. / オブジェクトが `Task` であることを識別。

  /**
   * Transforms the result of the `Task` using the provided function and returns a new `Task`.
   * `Task` の結果を指定された関数で変換し、新しい `Task` を返します。
   * @param fn - A function to transform the result. / 結果を変換する関数。
   */
  readonly map: <U>(fn: (value: T) => U) => Task<U>;

  /**
   * Transforms the result of the `Task` using the provided function and returns a new `Task`.
   * Alias for `map`.
   * `Task` の結果を指定された関数で変換し、新しい `Task` を返します。
   * `map` のエイリアス。
   * @param fn - A function to transform the result. / 結果を変換する関数。
   */
  readonly "<$>": <U>(fn: (value: T) => U) => Task<U>;

  /**
   * Chains another `Task` based on the result of this `Task` and flattens the result.
   * この `Task` の結果をもとに別の `Task` を連結し、その結果を平坦化して返します。
   * @param fn - A function that returns a `Task`. / `Task` を返す関数。
   */
  readonly flatMap: <U>(fn: (value: T) => Task<U>) => Task<U>;

  /**
   * Chains another `Task` based on the result of this `Task` and flattens the result.
   * Alias for `flatMap`.
   * この `Task` の結果をもとに別の `Task` を連結し、その結果を平坦化して返します。
   * `flatMap` のエイリアス。
   * @param fn - A function that returns a `Task`. / `Task` を返す関数。
   */
  readonly ">>=": <U>(fn: (value: T) => Task<U>) => Task<U>;

  /**
   * Applies a `Task` that contains a function to a `Task` that contains a value and returns a new `Task`.
   * 関数を含む `Task` を値を含む別の `Task` に適用し、新しい `Task` を返します。
   * @param taskValue - A `Task` containing the value. / 値を含む `Task`。
   */
  readonly apply: <U, V>(taskValue: Task<U>) => Task<V>;

  /**
   * Applies a `Task` that contains a function to a `Task` that contains a value and returns a new `Task`.
   * Alias for `apply`.
   * 関数を含む `Task` を値を含む別の `Task` に適用し、新しい `Task` を返します。
   * `apply` のエイリアス。
   * @param taskValue - A `Task` containing the value. / 値を含む `Task`。
   */
  readonly "<*>": <U, V>(taskValue: Task<U>) => Task<V>;

  /**
   * Executes the asynchronous computation and returns a `Promise` that resolves with the result.
   * 非同期計算を実行し、その結果で解決する `Promise` を返します。
   */
  readonly run: () => Promise<T>;
};

/**
 * Creates a new `Task` from an asynchronous computation function.
 * 非同期計算関数から新しい `Task` を作成します。
 * @param fn - A function that performs the asynchronous computation. / 非同期計算を実行する関数。
 */
const task = <T>(fn: () => Promise<T>): Task<T> => {
  const map = <U>(transform: (value: T) => U): Task<U> =>
    task(() => fn().then(transform));
  const flatMap = <U>(transform: (value: T) => Task<U>): Task<U> =>
    task(() => fn().then((value) => transform(value).run()));
  const apply = function <U, V>(
    this: Task<(value: U) => V>,
    taskValue: Task<U>
  ): Task<V> {
    return task(() =>
      this.run().then((fn) => {
        if (typeof fn !== "function") {
          return Promise.reject(new TypeError("fn is not a function"));
        }
        return taskValue.run().then((value) => fn(value));
      })
    );
  };

  const run = fn;

  return {
    isTask: true,
    map,
    flatMap,
    apply,
    run,
    "<$>": map,
    "<*>": apply,
    ">>=": flatMap,
  };
};

/**
 * Creates a `Task` that attempts the given computation, and falls back to a recovery function on failure.
 * 指定された計算を試み、失敗時にはリカバリー関数にフォールバックする `Task` を作成します。
 * @param fn - A function that performs the computation. / 計算を実行する関数。
 * @param onError - A recovery function for handling errors. / エラーを処理するリカバリー関数。
 */
const tryCatch = <T>(
  fn: () => T | Promise<T>,
  onError: (error: any) => T | Promise<T>
): Task<T> =>
  task(() =>
    Promise.resolve()
      .then(() => fn())
      .catch((error) => Promise.resolve(onError(error)))
  );

/**
 * Creates a `Task` that performs the given computation, propagating any errors that occur.
 * 指定された計算を実行し、発生したエラーを伝播する `Task` を作成します。
 * @param fn - A function that performs the computation. / 計算を実行する関数。
 */
const tryTask = <T>(fn: () => T | Promise<T>): Task<T> =>
  tryCatch(fn, (error) => Promise.reject(error));

/**
 * Lifts a value into a `Task`, which resolves immediately with the value.
 * 値を `Task` に持ち上げ、即座にその値で解決される `Task` を返します。
 * @param value - The value to lift into the `Task`. / `Task` に持ち上げる値。
 */
const lift = <T>(value: T): Task<T> => task(() => Promise.resolve(value));

/**
 * Checks if the given value is a `Task`.
 * 指定された値が `Task` かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isTask = <T>(value: any): value is Task<T> => value?.isTask === true;

/**
 * Enables a "do notation" for Task, allowing for sequential composition of Task operations.
 * Task に対して「do 記法」を提供し、Task の操作を逐次的に記述できるようにします。
 *
 * @param generatorFunc - A generator function yielding Task values.
 *                        Task の値を `yield` するジェネレータ関数。
 * @returns A Task containing the final computed value.
 *          計算結果を含む Task を返します。
 */
function Do<T, U>(generatorFunc: () => Generator<Task<T>, U, T>): Task<U> {
  const iterator = generatorFunc();

  function step(value?: T): Task<U> {
    const { value: result, done } = iterator.next(value as T);
    return done ? Task.pack(result) : result[">>="](step);
  }

  return step(undefined as never);
}

/**
 * Task utility object containing constructors and helper functions.
 * コンストラクタとヘルパー関数を含む `Task` ユーティリティオブジェクト。
 */
export const Task = {
  do: Do,
  from: task,
  pack: lift,
  tryCatch,
  tryTask,
  isTask,
} as const;

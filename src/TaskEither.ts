import type { Task } from "./Task";
import { Task as TaskMod } from "./Task";
import type { Either } from "./Either";
import { Either as EitherMod } from "./Either";

/**
 * Represents an asynchronous computation that can fail with `L` or succeed with `R`.
 * 非同期計算を表し、失敗時は `L`、成功時は `R` を返します。
 */
export type TaskEither<L, R> = {
  readonly isTaskEither: true;

  /**
   * Maps the `Right` value with the provided function.
   * 右側の値に関数を適用します。
   */
  readonly map: <U>(fn: (value: R) => U) => TaskEither<L, U>;

  /**
   * Alias of `map`.
   * `map` のエイリアス。
   */
  readonly "<$>": <U>(fn: (value: R) => U) => TaskEither<L, U>;

  /**
   * Applies a function inside `Right` to a value inside another `TaskEither`.
   * 右側に入った関数を別の `TaskEither` の右側の値に適用します。
   */
  readonly apply: <A, B>(
    this: TaskEither<L, (a: A) => B>,
    boxValue: TaskEither<L, A>
  ) => TaskEither<L, B>;

  /**
   * Alias of `apply`.
   * `apply` のエイリアス。
   */
  readonly "<*>": <A, B>(
    this: TaskEither<L, (a: A) => B>,
    boxValue: TaskEither<L, A>
  ) => TaskEither<L, B>;

  /**
   * Binds the `Right` value to the next computation.
   * 右側の値を次の計算へ渡します。
   */
  readonly flatMap: <U>(fn: (value: R) => TaskEither<L, U>) => TaskEither<L, U>;

  /**
   * Alias of `flatMap`.
   * `flatMap` のエイリアス。
   */
  readonly ">>=": <U>(fn: (value: R) => TaskEither<L, U>) => TaskEither<L, U>;

  /**
   * Runs the computation and returns a Promise of `Either<L, R>`.
   * 計算を実行し、`Either<L, R>` の `Promise` を返します。
   */
  readonly run: () => Promise<Either<L, R>>;

  /**
   * Returns the underlying `Task<Either<L, R>>` value.
   * 内部の `Task<Either<L, R>>` を返します。
   */
  readonly toTask: () => Task<Either<L, R>>;

  /**
   * Pattern matches on `Left` or `Right` asynchronously, returning a `Task<U>`.
   * `Left` または `Right` をパターンマッチし、`Task<U>` を返します。
   */
  readonly match: <U>(onLeft: (l: L) => U, onRight: (r: R) => U) => Task<U>;
};

/**
 * Adapter type for Do's `$` parameter.
 * `$` は `yield* $(TaskEither.right(...))` のためのアダプタ関数です。
 */
export type $TaskEither<L> = <A>(fa: TaskEither<L, A>) => Generator<any, A, any>;

/**
 * Internal constructor from `Task<Either<L, R>>`.
 * `Task<Either<L, R>>` から `TaskEither<L, R>` を作成します。
 */
const from = <L, R>(fa: Task<Either<L, R>>): TaskEither<L, R> => {
  const map = <U>(fn: (value: R) => U): TaskEither<L, U> =>
    from(fa.map((e) => e.map(fn)));

  const flatMap = <U>(
    fn: (value: R) => TaskEither<L, U>
  ): TaskEither<L, U> =>
    from(
      fa.flatMap((e) =>
        e.isLeft
          ? TaskMod.pack<Either<L, U>>(EitherMod.left<L, U>(e.getValue()))
          : fn(e.getValue()).toTask()
      )
    );

  const apply = function <A, B>(
    this: TaskEither<L, (a: A) => B>,
    boxValue: TaskEither<L, A>
  ): TaskEither<L, B> {
    return from(
      this.toTask().flatMap((efn) => {
        if (efn.isLeft) return TaskMod.pack(EitherMod.left<L, B>(efn.getValue()));
        const fn = efn.getValue();
        return boxValue
          .toTask()
          .map((ev) => (ev.isLeft ? EitherMod.left<L, B>(ev.getValue()) : ev.map(fn)));
      })
    );
  };

  const run = () => fa.run();
  const toTask = () => fa;
  const match = <U>(onLeft: (l: L) => U, onRight: (r: R) => U) =>
    fa.map((e) => e.match(onLeft, onRight));

  return {
    isTaskEither: true,
    map,
    flatMap,
    apply,
    run,
    toTask,
    match,
    "<$>": map,
    "<*>": apply,
    ">>=": flatMap,
  } as const;
};

/**
 * Lifts a `Right` value into `TaskEither`.
 * `Right` の値を `TaskEither` に持ち上げます。
 */
const right = <L, R>(value: R): TaskEither<L, R> =>
  from(TaskMod.pack(EitherMod.right<L, R>(value)));

/**
 * Lifts a `Left` value into `TaskEither`.
 * `Left` の値を `TaskEither` に持ち上げます。
 */
const left = <L, R = never>(value: L): TaskEither<L, R> =>
  from(TaskMod.pack(EitherMod.left<L, R>(value)));

/**
 * Lifts a `Task<R>` into `TaskEither<L, R>` as `Right`.
 * `Task<R>` を `Right` として `TaskEither<L, R>` に持ち上げます。
 */
const fromTask = <L, R>(task: Task<R>): TaskEither<L, R> =>
  from(task.map((r) => EitherMod.right<L, R>(r)));

/**
 * Lifts an `Either<L, R>` into `TaskEither<L, R>`.
 * `Either<L, R>` を `TaskEither<L, R>` に持ち上げます。
 */
const fromEither = <L, R>(e: Either<L, R>): TaskEither<L, R> =>
  from(TaskMod.pack(e));

/**
 * Creates a `TaskEither` that runs the computation and captures errors as `Left`.
 * 計算を実行し、エラーを `Left` として捕捉する `TaskEither` を作成します。
 */
const tryCatch = <L, R>(
  fn: () => R | Promise<R>,
  onError: (error: any) => L
): TaskEither<L, R> =>
  from(
    TaskMod.from(() =>
      Promise.resolve()
        .then(() => fn())
        .then<Either<L, R>>((r) => EitherMod.right<L, R>(r))
        .catch<Either<L, R>>((e) => Promise.resolve(EitherMod.left<L, R>(onError(e))))
    )
  );

/**
 * Type guard to check if a value is `TaskEither`.
 * 値が `TaskEither` かどうかを判定するタイプガード。
 */
const isTaskEither = <L, R>(value: any): value is TaskEither<L, R> =>
  value?.isTaskEither === true;

// Do-notation support
const GenTaskEitherSym: unique symbol = Symbol();
type GenTaskEither<L, A> = {
  readonly _tag: typeof GenTaskEitherSym;
  readonly fa: TaskEither<L, A>;
};

// Overload 1: legacy style (yield TaskEither<L, R>)
function Do<L, R, U>(
  generatorFunc: () => Generator<TaskEither<L, R>, U | TaskEither<L, U>, R>
): TaskEither<L, U>;
// Overload 2: adapter style (yield* $(fa))
function Do<L, R>(
  g: (
    $: <A>(fa: TaskEither<L, A>) => Generator<any, A, any>
  ) => Generator<any, R, any>
): TaskEither<L, R>;
// Implementation
function Do<L, R>(arg: any): TaskEither<L, R> {
  if (typeof arg === "function" && arg.length >= 1) {
    const $ = <A>(fa: TaskEither<L, A>) =>
      (function*(): Generator<GenTaskEither<L, A>, A, any> {
        return yield { _tag: GenTaskEitherSym, fa } as any;
      })();

    const it = arg($);
    const step = (prev?: unknown): TaskEither<L, R> => {
      const n = it.next(prev);
      if (n.done) return TaskEither.pack<L, R>(n.value as R);
      const y = n.value as GenTaskEither<L, unknown>;
      return y.fa[">>="](step as any) as any;
    };
    return step(undefined as never);
  }

  const iterator = (
    arg as () => Generator<TaskEither<L, R>, any | TaskEither<L, R>, any>
  )();
  function step(value?: R): TaskEither<L, R> {
    const { value: result, done } = iterator.next(value as R);
    return done
      ? TaskEither.isTaskEither(result)
        ? (result as TaskEither<L, R>)
        : TaskEither.pack<L, R>(result as R)
      : (result as TaskEither<L, R>)[">>="](step);
  }

  return step(undefined as never);
}

/**
 * Utility object for `TaskEither` constructors and helpers.
 * `TaskEither` のコンストラクタとヘルパーをまとめたユーティリティ。
 */
export const TaskEither: {
  do: typeof Do;
  from: typeof from;
  pack: typeof right;
  right: typeof right;
  left: typeof left;
  fromTask: typeof fromTask;
  fromEither: typeof fromEither;
  tryCatch: typeof tryCatch;
  isTaskEither: typeof isTaskEither;
} = {
  do: Do,
  from,
  pack: right,
  right,
  left,
  fromTask,
  fromEither,
  tryCatch,
  isTaskEither,
};

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
   * @param fn - A function to transform the `Right` value. / `Right` の値を変換する関数。
   */
  readonly map: <U>(fn: (value: R) => U) => TaskEither<L, U>;

  /**
   * Alias of `map`.
   * `map` のエイリアス。
   * @param fn - A function to transform the `Right` value. / `Right` の値を変換する関数。
   */
  readonly "<$>": <U>(fn: (value: R) => U) => TaskEither<L, U>;

  /**
   * Applies a function inside `Right` to a value inside another `TaskEither`.
   * 右側に入った関数を別の `TaskEither` の右側の値に適用します。
   * @param boxValue - A `TaskEither` containing the value. / 値を含む `TaskEither`。
   */
  readonly apply: <A, B>(
    this: TaskEither<L, (a: A) => B>,
    boxValue: TaskEither<L, A>
  ) => TaskEither<L, B>;

  /**
   * Alias of `apply`.
   * `apply` のエイリアス。
   * @param boxValue - A `TaskEither` containing the value. / 値を含む `TaskEither`。
   */
  readonly "<*>": <A, B>(
    this: TaskEither<L, (a: A) => B>,
    boxValue: TaskEither<L, A>
  ) => TaskEither<L, B>;

  /**
   * Binds the `Right` value to the next computation.
   * 右側の値を次の計算へ渡します。
   * @param fn - A function returning `TaskEither`. / `TaskEither` を返す関数。
   */
  readonly flatMap: <U>(fn: (value: R) => TaskEither<L, U>) => TaskEither<L, U>;

  /**
   * Alias of `flatMap`.
   * `flatMap` のエイリアス。
   * @param fn - A function returning `TaskEither`. / `TaskEither` を返す関数。
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
   * @param onLeft - Handler for `Left`. / `Left` の処理関数。
   * @param onRight - Handler for `Right`. / `Right` の処理関数。
   */
  readonly match: <U>(onLeft: (l: L) => U, onRight: (r: R) => U) => Task<U>;
};

/**
 * Adapter type for Do's `$` parameter.
 * `$` は `yield* $(TaskEither.right(...))` のためのアダプタ関数です。
 */
export type $TaskEither<L> = <A>(fa: TaskEither<L, A>) => Generator<any, A, any>;

/**
 * Creates a `TaskEither` from a `Task<Either<L, R>>`.
 * `Task<Either<L, R>>` から `TaskEither<L, R>` を作成します。
 * @param fa - A task producing an Either. / `Either` を生成する `Task`。
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
 * Lifts a value into `TaskEither` as `Right`.
 * 値を `Right` として `TaskEither` に持ち上げます。
 * @param value - The value to lift. / 持ち上げる値。
 */
const right = <L, R>(value: R): TaskEither<L, R> =>
  from(TaskMod.pack(EitherMod.right<L, R>(value)));

/**
 * Lifts an error into `TaskEither` as `Left`.
 * エラーを `Left` として `TaskEither` に持ち上げます。
 * @param value - The error value. / エラー値。
 */
const left = <L, R = never>(value: L): TaskEither<L, R> =>
  from(TaskMod.pack(EitherMod.left<L, R>(value)));

/**
 * Lifts a `Task<R>` into `TaskEither<L, R>` as `Right`.
 * `Task<R>` を `Right` として `TaskEither<L, R>` に持ち上げます。
 * @param task - The task to lift. / 持ち上げる `Task`。
 */
const fromTask = <L, R>(task: Task<R>): TaskEither<L, R> =>
  from(task.map((r) => EitherMod.right<L, R>(r)));

/**
 * Lifts an `Either<L, R>` into `TaskEither<L, R>`.
 * `Either<L, R>` を `TaskEither<L, R>` に持ち上げます。
 * @param e - The either to lift. / 持ち上げる `Either`。
 */
const fromEither = <L, R>(e: Either<L, R>): TaskEither<L, R> =>
  from(TaskMod.pack(e));

/**
 * Runs TaskEithers in parallel and combines results.
 * If any result is Left, returns the first Left (by array order) after all complete.
 * 複数の TaskEither を並列実行し、結果を結合します。1つでも Left があれば、配列順で最初の Left を返します（全完了後判定）。
 * @param tasks - TaskEithers to run in parallel. / 並列実行する TaskEither 配列。
 */
const all = <L, R>(tasks: readonly TaskEither<L, R>[]): TaskEither<L, R[]> =>
  from(
    TaskMod.from(async () => {
      const results = await Promise.all(tasks.map((te) => te.toTask().run()));
      for (const r of results) {
        if (r.isLeft) return EitherMod.left<L, R[]>(r.getValue());
      }
      return EitherMod.right<L, R[]>(results.map((r) => r.getValue() as R));
    })
  );

/**
 * Runs TaskEithers in parallel and returns all raw results without short-circuiting.
 * Promise.all に類似し、全件の `Either` を `Task` で返します（ショートサーキットなし）。
 * @param tasks - TaskEithers to run in parallel. / 並列実行する TaskEither 配列。
 */
const allSettled = <L, R>(
  tasks: readonly TaskEither<L, R>[]
): Task<Either<L, R>[]> => TaskMod.from(() => Promise.all(tasks.map((te) => te.toTask().run())));

/**
 * Partitions results into lefts and rights without short-circuiting.
 * 結果を Left/Right に仕分けして返します（ショートサーキットなし）。
 * @param tasks - TaskEithers to run in parallel. / 並列実行する TaskEither 配列。
 */
const partition = <L, R>(
  tasks: readonly TaskEither<L, R>[]
): Task<[L[], R[]]> =>
  TaskMod.from(async () => {
    const results = await Promise.all(tasks.map((te) => te.toTask().run()));
    const lefts: L[] = [];
    const rights: R[] = [];
    for (const r of results) {
      if (r.isLeft) lefts.push(r.getValue());
      else rights.push(r.getValue());
    }
    return [lefts, rights];
  });

/**
 * Validates all TaskEithers: accumulates all errors if any, otherwise returns all successes.
 * すべて成功すれば `Right(values[])`、1件以上失敗があれば `Left(errors[])` を返します。
 * @param tasks - TaskEithers to run in parallel. / 並列実行する TaskEither 配列。
 */
const validateAll = <L, R>(
  tasks: readonly TaskEither<L, R>[]
): TaskEither<L[], R[]> =>
  from(
    TaskMod.from(async () => {
      const results = await Promise.all(tasks.map((te) => te.toTask().run()));
      const lefts: L[] = [];
      const rights: R[] = [];
      for (const r of results) {
        if (r.isLeft) lefts.push(r.getValue());
        else rights.push(r.getValue());
      }
      return lefts.length > 0
        ? EitherMod.left<L[], R[]>(lefts)
        : EitherMod.right<L[], R[]>(rights);
    })
  );

/**
 * Traverses an array with a TaskEither-returning function and sequences the results.
 * 配列の各要素に関数を適用し、`TaskEither` を順に合成します。
 * @param as - Input array. / 入力配列。
 * @param f - Mapping function returning TaskEither. / TaskEither を返す関数。
 */
const traverse = <L, A, B>(
  as: readonly A[],
  f: (a: A) => TaskEither<L, B>
): TaskEither<L, B[]> => all(as.map(f));

/**
 * Sequences a record of TaskEithers into a TaskEither of record.
 * レコードの TaskEither を、同構造の値のレコードへ順序付けします。
 * @param obj - A record of TaskEithers. / TaskEither のレコード。
 */
const struct = <L, T extends Record<string, TaskEither<L, any>>>(
  obj: T
): TaskEither<L, { [K in keyof T]: T[K] extends TaskEither<L, infer R> ? R : never }> =>
  from(
    TaskMod.from(async () => {
      const keys = Object.keys(obj);
      const tasks = Object.values(obj).map((te) => te.run());
      const results = await Promise.all(tasks);

      const out: any = {};
      for (let i = 0; i < results.length; i++) {
        const r = results[i] as Either<L, unknown>;
        if (r.isLeft) return EitherMod.left<L, any>(r.getValue());
        out[keys[i]] = r.getValue();
      }
      return EitherMod.right(out);
    })
  );

/**
 * Creates a `TaskEither` that runs the computation, capturing thrown/rejected errors as `Left` via `onError`.
 * 計算を実行し、投げられた/拒否されたエラーを `onError` で `Left` に変換します。
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
 * 値が `TaskEither` かどうかを判定します。
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
  all: typeof all;
  allSettled: typeof allSettled;
  partition: typeof partition;
  validateAll: typeof validateAll;
  traverse: typeof traverse;
  struct: typeof struct;
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
  all,
  allSettled,
  partition,
  validateAll,
  traverse,
  struct,
  fromTask,
  fromEither,
  tryCatch,
  isTaskEither,
};

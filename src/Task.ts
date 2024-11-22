export type Task<T> = {
  readonly isTask: true;
  readonly map: <U>(fn: (value: T) => U) => Task<U>;
  readonly flatMap: <U>(fn: (value: T) => Task<U>) => Task<U>;
  readonly apply: <U, V>(taskValue: Task<U>) => Task<V>;
  readonly run: () => Promise<T>;
  readonly "<$>": <U>(fn: (value: T) => U) => Task<U>;
  readonly "<*>": <U, V>(taskValue: Task<U>) => Task<V>;
  readonly ">>=": <U>(fn: (value: T) => Task<U>) => Task<U>;
};

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

// ヘルパーメソッド
const tryCatch = <T>(
  fn: () => T | Promise<T>,
  onError: (error: any) => T | Promise<T>
): Task<T> =>
  task(() =>
    Promise.resolve()
      .then(() => fn())
      .catch((error) => Promise.resolve(onError(error)))
  );

const tryTask = <T>(fn: () => T | Promise<T>): Task<T> =>
  tryCatch(fn, (error) => Promise.reject(error));

const lift = <T>(value: T): Task<T> => task(() => Promise.resolve(value));

const isTask = <T>(value: any): value is Task<T> => value?.isTask === true;

export const Task = {
  pack: task,
  lift,
  tryCatch,
  tryTask,
  isTask,
} as const;

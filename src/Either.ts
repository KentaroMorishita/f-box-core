/*
 * Represents a value that might be an error (Left) or a valid result (Right).
 * エラー（Left）または有効な結果（Right）の値を表現します。
 */
type None = null | undefined | void;

/**
 * Represents a value that can be either `Left` or `Right`.
 * `Left` または `Right` のいずれかである値を表します。
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

/**
 * Represents a `Left` value, encapsulating an error or invalid result.
 * エラーや無効な結果を包み込む `Left` 型。
 */
export type Left<L, R> = {
  readonly isEither: true; // Identifies the object as an `Either`. / オブジェクトが `Either` であることを識別。
  readonly isLeft: true; // Identifies the object as an `Left`. / オブジェクトが `Left` であることを識別。
  readonly isRight: false; // Identifies the object as an `Right`. / オブジェクトが `Right` であることを識別。

  /**
   * Ignores the provided function and returns itself since there is no valid value.
   * 指定された関数を無視し、有効な値が存在しないため自身を返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly map: <U>(_fn: (value: R) => U) => Left<L, U>;

  /**
   * Ignores the provided function and returns itself since there is no valid value.
   * Alias for `map`.
   * 指定された関数を無視し、有効な値が存在しないため自身を返します。
   * `map` のエイリアス。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly "<$>": <U>(_fn: (value: R) => U) => Left<L, U>;

  /**
   * Ignores the provided function and boxed value, returning itself since there is no valid value.
   * 指定された関数とボックス化された値を無視し、有効な値が存在しないため自身を返します。
   * @param this - Ignored boxed function. / 無視されるボックス化された関数。
   * @param boxValue - Ignored boxed value. / 無視されるボックス化された値。
   */
  readonly apply: <A, B>(
    this: Either<L, (a: A) => B>,
    boxValue: Either<L, A>
  ) => Either<L, B>;

  /**
   * Ignores the provided function and boxed value, returning itself since there is no valid value.
   * Alias for `apply`.
   * 指定された関数とボックス化された値を無視し、有効な値が存在しないため自身を返します。
   * `apply` のエイリアス。
   * @param this - Ignored boxed function. / 無視されるボックス化された関数。
   * @param boxValue - Ignored boxed value. / 無視されるボックス化された値。
   */
  readonly "<*>": <A, B>(
    this: Either<L, (a: A) => B>,
    boxValue: Either<L, A>
  ) => Either<L, B>;

  /**
   * Ignores the provided function, returning itself since there is no valid value.
   * 指定された関数を無視し、有効な値が存在しないため自身を返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly flatMap: <U>(_fn: (value: R) => Either<L, U>) => Left<L, U>;

  /**
   * Ignores the provided function, returning itself since there is no valid value.
   * Alias for `flatMap`.
   * 指定された関数を無視し、有効な値が存在しないため自身を返します。
   * `flatMap` のエイリアス。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly ">>=": <U>(_fn: (value: R) => Either<L, U>) => Left<L, U>;

  /**
   * Gets the value inside the `Left`.
   * `Left` 内の値を取得します。
   */
  readonly getValue: () => L;

  /**
   * Returns the provided default value since this represents an invalid result.
   * 無効な結果を表しているため、指定されたデフォルト値を返します。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly orElse: <U>(defaultValue: Either<L, U>) => Either<L, U>;

  /**
   * Returns the provided default value since this represents an invalid result.
   * Alias for `orElse`.
   * 無効な結果を表しているため、指定されたデフォルト値を返します。
   * `orElse` のエイリアス。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly "<?>": <U>(defaultValue: Either<L, U>) => Either<L, U>;

  /**
   * Returns the provided default value since this represents an invalid result.
   * 無効な結果を表しているため、指定されたデフォルト値を返します。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly getOrElse: <U>(defaultValue: U) => U;

  /**
   * Returns the provided default value since this represents an invalid result.
   * Alias for `getOrElse`.
   * 無効な結果を表しているため、指定されたデフォルト値を返します。
   * `getOrElse` のエイリアス。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly "<|>": <U>(defaultValue: U) => U;

  /**
   * Matches the `Left` case and applies the corresponding function.
   * `Left` の場合に対応する関数を適用します。
   * @param onLeft - A function to apply if `Left`. / `Left` の場合に適用する関数。
   * @param _onRight - Ignored function. / 無視される関数。
   */
  readonly match: <U>(onLeft: (value: L) => U, _onRight: (value: R) => U) => U;
};

/**
 * Represents a `Right` value, encapsulating a valid result.
 * 有効な結果を包み込む `Right` 型。
 */
export type Right<L, R> = {
  readonly isEither: true; // Identifies the object as an `Either`. / オブジェクトが `Either` であることを識別。
  readonly isLeft: false; // Identifies the object as an `Left`. / オブジェクトが `Left` であることを識別。
  readonly isRight: true; // Identifies the object as an `Right`. / オブジェクトが `Right` であることを識別。

  /**
   * Applies a function to the value inside the `Right` and returns a new `Either`.
   * `Right` 内の値に関数を適用し、新しい `Either` を返します。
   * @param fn - A function to apply to the `Right` value. / `Right` の値に適用する関数。
   */
  readonly map: <U>(fn: (value: R) => U) => Either<L, U>;

  /**
   * Applies a function to the value inside the `Right` and returns a new `Either`.
   * Alias for `map`.
   * `Right` 内の値に関数を適用し、新しい `Either` を返します。
   * `map` のエイリアス。
   * @param fn - A function to apply to the `Right` value. / `Right` の値に適用する関数。
   */
  readonly "<$>": <U>(fn: (value: R) => U) => Either<L, U>;

  /**
   * Applies a boxed function to the value inside the `Right` and returns a new `Either`.
   * `Right` に包まれた関数を別の `Either` に適用し、新しい `Either` を返します。
   * @param boxValue - A boxed value to apply the function to. / 関数を適用する値を含むボックス。
   */
  readonly apply: <A, B>(
    this: Either<L, (a: A) => B>,
    boxValue: Either<L, A>
  ) => Either<L, B>;

  /**
   * Applies a boxed function to the value inside the `Right` and returns a new `Either`.
   * Alias for `apply`.
   * `Right` に包まれた関数を別の `Either` に適用し、新しい `Either` を返します。
   * `apply` のエイリアス。
   * @param boxValue - A boxed value to apply the function to. / 関数を適用する値を含むボックス。
   */
  readonly "<*>": <A, B>(
    this: Either<L, (a: A) => B>,
    boxValue: Either<L, A>
  ) => Either<L, B>;

  /**
   * Applies a function that returns an `Either` to the value inside this `Right` and flattens the result.
   * `Right` 内の値に `Either` を返す関数を適用し、その結果を平坦化して返します。
   * @param fn - A function that returns an `Either`. / `Either` を返す関数。
   */
  readonly flatMap: <U>(fn: (value: R) => Either<L, U>) => Either<L, U>;

  /**
   * Applies a function that returns an `Either` to the value inside this `Right` and flattens the result.
   * Alias for `flatMap`.
   * `Right` 内の値に `Either` を返す関数を適用し、その結果を平坦化して返します。
   * `flatMap` のエイリアス。
   * @param fn - A function that returns an `Either`. / `Either` を返す関数。
   */
  readonly ">>=": <U>(fn: (value: R) => Either<L, U>) => Either<L, U>;

  /**
   * Gets the value inside the `Right`.
   * `Right` 内の値を取得します。
   */
  readonly getValue: () => R;

  /**
   * Returns the current `Right` since it represents a valid result.
   * 有効な結果を表しているため、現在の `Right` を返します。
   * @param defaultValue - Ignored value. / 無視される値。
   */
  readonly orElse: (defaultValue: Either<L, R>) => Either<L, R>;

  /**
   * Returns the current `Right` since it represents a valid result.
   * Alias for `orElse`.
   * 有効な結果を表しているため、現在の `Right` を返します。
   * `orElse` のエイリアス。
   * @param defaultValue - Ignored value. / 無視される値。
   */
  readonly "<?>": (defaultValue: Either<L, R>) => Either<L, R>;

  /**
   * Returns the value inside the `Right`, ignoring the provided default value.
   * `Right` 内の値を返し、指定されたデフォルト値は無視されます。
   * @param defaultValue - Ignored value. / 無視される値。
   */
  readonly getOrElse: (defaultValue: R) => R;

  /**
   * Returns the value inside the `Right`, ignoring the provided default value.
   * Alias for `getOrElse`.
   * `Right` 内の値を返し、指定されたデフォルト値は無視されます。
   * `getOrElse` のエイリアス。
   * @param defaultValue - Ignored value. / 無視される値。
   */
  readonly "<|>": (defaultValue: R) => R;

  /**
   * Matches the `Right` case and applies the corresponding function.
   * `Right` の場合に対応する関数を適用します。
   * @param _onLeft - Ignored function. / 無視される関数。
   * @param onRight - A function to apply if `Right`. / `Right` の場合に適用する関数。
   */
  readonly match: <U>(_onLeft: (value: L) => U, onRight: (value: R) => U) => U;
};

/**
 * Constructs a `Left` instance containing the given value.
 * 指定された値を含む `Left` インスタンスを作成します。
 * @param value - The error or invalid state to encapsulate. / 包み込むエラーまたは無効な状態。
 */
const left = <L, R>(value: L): Left<L, R> =>
  ({
    isEither: true,
    isLeft: true,
    isRight: false,
    map: () => left(value),
    apply: () => left(value),
    flatMap: () => left(value),
    getValue: () => value,
    orElse: <U>(defaultValue: Either<L, U>): Either<L, U> => defaultValue,
    getOrElse: <U>(defaultValue: U): U => defaultValue,
    match: (onLeft, _onRight) => onLeft(value),
    "<$>": () => left(value),
    "<*>": () => left(value),
    ">>=": () => left(value),
    "<?>": (defaultValue) => defaultValue,
    "<|>": (defaultValue) => defaultValue,
  } as const);

/**
 * Constructs a `Right` instance containing the given value.
 * 指定された値を含む `Right` インスタンスを作成します。
 * @param value - The valid result to encapsulate. / 包み込む有効な結果。
 */
const right = <L, R>(value: R): Right<L, R> => {
  const map = <U>(fn: (value: R) => U): Either<L, U> => right(fn(value));
  const apply = function <A, B>(
    this: Either<L, (a: A) => B>,
    boxValue: Either<L, A>
  ): Either<L, B> {
    if (isLeft(this)) {
      return left<L, B>(this.getValue());
    }
    if (isLeft(boxValue)) {
      return left<L, B>(boxValue.getValue());
    }
    const fn = this.getValue();
    return boxValue.map((a) => fn(a));
  };
  const flatMap = <U>(fn: (value: R) => Either<L, U>): Either<L, U> =>
    fn(value);
  const getValue = () => value;
  const orElse = (_defaultValue: Either<L, R>): Either<L, R> => right(value);
  const getOrElse = (_defaultValue: R): R => value;
  const match = <U>(_onLeft: (l: L) => U, onRight: (r: R) => U) =>
    onRight(value);

  return {
    isEither: true,
    isLeft: false,
    isRight: true,
    map,
    apply,
    flatMap,
    getValue,
    orElse,
    getOrElse,
    match,
    "<$>": map,
    "<*>": apply,
    ">>=": flatMap,
    "<?>": orElse,
    "<|>": getOrElse,
  } as const;
};

/**
 * A convenience alias for the `right` constructor.
 * `right` コンストラクタの簡易エイリアス。
 */
const either = right;

/**
 * Checks if the given value is `None` (null, undefined, or void).
 * 指定された値が `None`（null、undefined、または void）かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isNone = (value: unknown): value is None =>
  value === null || value === undefined;

/**
 * Checks if the given value is an `Either`.
 * 指定された値が `Either` かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isEither = <L, R>(value: unknown): value is Either<L, R> => {
  if (typeof value !== "object" || isNone(value)) return false;
  if (!('isEither' in value)) return false;
  return value.isEither === true;
};

/**
 * Checks if the given `Either` is a `Left`.
 * 指定された `Either` が `Left` かどうかを判定します。
 * @param value - The `Either` to check. / 判定する `Either`。
 */
const isLeft = <L, R>(value: Either<L, R>): value is Left<L, R> =>
  isEither<L, R>(value) && value.isLeft;

/**
 * Checks if the given `Either` is a `Right`.
 * 指定された `Either` が `Right` かどうかを判定します。
 * @param value - The `Either` to check. / 判定する `Either`。
 */
const isRight = <L, R>(value: Either<L, R>): value is Right<L, R> =>
  isEither<L, R>(value) && value.isRight;

/**
 * A utility object containing constructors and helpers for `Either`.
 * `Either` のコンストラクタおよびヘルパーを含むユーティリティオブジェクト。
 */
export const Either = {
  pack: either,
  right,
  left,
  isNone,
  isEither,
  isLeft,
  isRight,
} as const;

/**
 * Represents a value that might be absent (null, undefined, or void).
 * 値が存在しない可能性を示します（null, undefined, または void）。
 */
type None = null | undefined | void;

/**
 * A `Maybe` type that encapsulates an optional value and provides methods to handle presence and absence.
 * オプションの値を包み込み、その存在と欠如を処理するためのメソッドを提供する `Maybe` 型。
 */
export type Maybe<T> = Just<T> | Nothing;

/**
 * Represents a `Just` value, encapsulating a present value.
 * 値が存在していることを表す `Just` 型。
 */
export type Just<T> = {
  readonly isMaybe: true; // Identifies the object as a `Maybe`. / オブジェクトが `Maybe` であることを識別。

  /**
   * Applies a function to the value inside the `Just` and returns a new `Maybe`.
   * `Just` 内の値に関数を適用し、新しい `Maybe` を返します。
   * @param fn - A function to apply to the `Just` value. / `Just` の値に適用する関数。
   */
  readonly map: <U>(fn: (value: T) => U) => Maybe<U>;

  /**
   * Applies a function to the value inside the `Just` and returns a new `Maybe`.
   * Alias for `map`.
   * `Just` 内の値に関数を適用し、新しい `Maybe` を返します。
   * `map` のエイリアス。
   * @param fn - A function to apply to the `Just` value. / `Just` の値に適用する関数。
   */
  readonly "<$>": <U>(fn: (value: T) => U) => Maybe<U>;

  /**
   * Applies a boxed function to the value inside the `Just` and returns a new `Maybe`.
   * `Just` に包まれた関数を別の `Maybe` に適用し、新しい `Maybe` を返します。
   * @param boxValue - A `Maybe` containing a value to apply the function to.
   *                   / 関数を適用する値を含む `Maybe`。
   */
  readonly apply: <A>(this: Just<(a: A) => T>, boxValue: Maybe<A>) => Maybe<T>;

  /**
   * Applies a boxed function to the value inside the `Just` and returns a new `Maybe`.
   * Alias for `apply`.
   * `Just` に包まれた関数を別の `Maybe` に適用し、新しい `Maybe` を返します。
   * `apply` のエイリアス。
   * @param boxValue - A `Maybe` containing a value to apply the function to.
   *                   / 関数を適用する値を含む `Maybe`。
   */
  readonly "<*>": <A>(this: Just<(a: A) => T>, boxValue: Maybe<A>) => Maybe<T>;

  /**
   * Applies a function that returns a `Maybe` to the value inside this `Just` and flattens the result.
   * `Just` 内の値に `Maybe` を返す関数を適用し、その結果を平坦化して返します。
   * @param fn - A function that returns a `Maybe`. / `Maybe` を返す関数。
   */
  readonly flatMap: <U>(fn: (value: T) => Maybe<U>) => Maybe<U>;

  /**
   * Applies a function that returns a `Maybe` to the value inside this `Just` and flattens the result.
   * Alias for `flatMap`.
   * `Just` 内の値に `Maybe` を返す関数を適用し、その結果を平坦化して返します。
   * `flatMap` のエイリアス。
   * @param fn - A function that returns a `Maybe`. / `Maybe` を返す関数。
   */
  readonly ">>=": <U>(fn: (value: T) => Maybe<U>) => Maybe<U>;

  /**
   * Gets the value inside the `Just`.
   * `Just` 内の値を取得します。
   */
  readonly getValue: () => T;

  /**
   * Returns the current `Just` if present, or the given default value.
   * 現在の `Just` が存在すればそれを返し、存在しなければ指定されたデフォルト値を返します。
   * @param defaultValue - The default `Maybe` to return if absent. / 存在しない場合に返すデフォルトの `Maybe`。
   */
  readonly orElse: (defaultValue: Maybe<T>) => Maybe<T>;

  /**
   * Returns the value inside the `Just`, or a provided default value if absent.
   * `Just` 内の値を返し、存在しなければ指定されたデフォルト値を返します。
   * @param defaultValue - The default value to return if absent. / 存在しない場合に返すデフォルト値。
   */
  readonly getOrElse: <U>(defaultValue: U) => T | U;

  /**
   * Matches the `Just` or `Nothing` case and applies the corresponding function.
   * `Just` または `Nothing` の場合に対応する関数を適用します。
   * @param onJust - A function to apply if `Just`. / `Just` の場合に適用する関数。
   * @param onNothing - A function to apply if `Nothing`. / `Nothing` の場合に適用する関数。
   */
  readonly match: <U>(onJust: (value: T) => U, onNothing: () => U) => U;
};

/**
 * Represents a `Nothing` value, encapsulating absence.
 * 値が存在しないことを表す `Nothing` 型。
 */
export type Nothing = {
  readonly isMaybe: true; // Identifies the object as a `Maybe`. / オブジェクトが `Maybe` であることを識別。

  /**
   * Returns itself since there is no value to map.
   * 値が存在しないため、自身をそのまま返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly map: <U>(_fn: (value: any) => U) => Nothing;

  /**
   * Alias for `map`. Returns itself since there is no value.
   * `map` のエイリアス。値が存在しないため、自身をそのまま返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly "<$>": <U>(_fn: (value: any) => U) => Nothing;

  /**
   * Returns itself since there is no value to apply.
   * 値が存在しないため、自身をそのまま返します。
   * @param _this - Ignored boxed function. / 無視される関数。
   * @param _boxValue - Ignored boxed value. / 無視される値。
   */
  readonly apply: <A>(_this: Nothing, _boxValue: Maybe<A>) => Nothing;

  /**
   * Alias for `apply`. Returns itself since there is no value to apply.
   * `apply` のエイリアス。値が存在しないため、自身をそのまま返します。
   * @param _this - Ignored boxed function. / 無視される関数。
   * @param _boxValue - Ignored boxed value. / 無視される値。
   */
  readonly "<*>": <A>(_this: Nothing, _boxValue: Maybe<A>) => Nothing;

  /**
   * Returns itself since there is no value to flatMap.
   * 値が存在しないため、自身をそのまま返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly flatMap: <U>(_fn: (value: any) => Maybe<U>) => Nothing;

  /**
   * Alias for `flatMap`. Returns itself since there is no value.
   * `flatMap` のエイリアス。値が存在しないため、自身をそのまま返します。
   * @param _fn - Ignored function. / 無視される関数。
   */
  readonly ">>=": <U>(_fn: (value: any) => Maybe<U>) => Nothing;

  /**
   * Always returns `null` for a `Nothing` type.
   * `Nothing` 型の場合は常に `null` を返します。
   */
  readonly getValue: () => null;

  /**
   * Returns the provided default value.
   * 指定されたデフォルト値を返します。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly orElse: <U>(defaultValue: Maybe<U>) => Maybe<U>;

  /**
   * Returns the provided default value since there is no value.
   * 値が存在しないため、指定されたデフォルト値を返します。
   * @param defaultValue - The default value to return. / 返すデフォルト値。
   */
  readonly getOrElse: <U>(defaultValue: U) => U;

  /**
   * Applies the `onNothing` function since there is no value.
   * 値が存在しないため、`onNothing` 関数を適用します。
   * @param _onJust - Ignored function. / 無視される関数。
   * @param onNothing - A function to handle the `Nothing` case. / `Nothing` を処理する関数。
   */
  readonly match: <U>(_onJust: (value: any) => U, onNothing: () => U) => U;
};

/**
 * A singleton instance representing a `Nothing` value.
 * `Nothing` 値を表すシングルトンインスタンス。
 */
const nothingSigleton: Nothing = {
  isMaybe: true,
  map: () => nothingSigleton,
  apply: () => nothingSigleton,
  flatMap: () => nothingSigleton,
  getValue: () => null,
  orElse: <U>(defaultValue: Maybe<U>): Maybe<U> => defaultValue,
  getOrElse: <U>(defaultValue: U): U => defaultValue,
  match: <U>(_onJust: (value: any) => U, onNothing: () => U): U => onNothing(),
  "<$>": () => nothingSigleton,
  "<*>": () => nothingSigleton,
  ">>=": () => nothingSigleton,
} as const;

/**
 * Creates a new `Maybe` instance based on the given value.
 * 指定された値に基づいて新しい `Maybe` インスタンスを作成します。
 * If the value is `null`, `undefined`, or `void`, it returns `Nothing`.
 * If the value is present, it returns a `Just`.
 * 値が `null`、`undefined`、または `void` の場合は `Nothing` を返し、
 * 値が存在する場合は `Just` を返します。
 * @param value - The value to encapsulate. / 包み込む値。
 */
const maybe = <T>(value: T | None): Maybe<T> => {
  return isNone(value) ? nothing() : just(value as NonNullable<T>);
};

/**
 * Returns the singleton instance of `Nothing`.
 * `Nothing` のシングルトンインスタンスを返します。
 */
const nothing = (): Nothing => nothingSigleton;

/**
 * Creates a new `Just` instance containing the given value.
 * 指定された値を含む新しい `Just` インスタンスを作成します。
 * @param value - The non-null value to encapsulate. / 包み込む非 null の値。
 */
const just = <T>(value: NonNullable<T>): Just<T> => {
  const map = <U>(fn: (value: T) => U): Maybe<U> => maybe(fn(value));
  const apply = function <A>(
    this: Just<(a: A) => T>,
    boxValue: Maybe<A>
  ): Maybe<T> {
    const fn = this.getValue();
    return isNothing(boxValue) ? nothing() : boxValue.map(fn);
  };

  const flatMap = <U>(fn: (value: T) => Maybe<U>): Maybe<U> => fn(value);
  const getValue = () => value;
  const orElse = (_defaultValue: Maybe<T>): Maybe<T> => just(value);
  const getOrElse = <U>(_defaultValue: U): T => value;
  const match = <U>(onJust: (value: T) => U, _onNothing: () => U): U =>
    onJust(value);

  return {
    isMaybe: true,
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
  } as const;
};

/**
 * Checks if the given value is `None` (null, undefined, or void).
 * 指定された値が `None`（null、undefined、または void）かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isNone = (value: any): value is None =>
  value === null || value === undefined;

/**
 * Checks if the given value is a `Maybe`.
 * 指定された値が `Maybe` かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isMaybe = <T>(value: any): value is Maybe<T> =>
  value && typeof value === "object" && value.isMaybe === true;

/**
 * Checks if the given value is `Nothing`.
 * 指定された値が `Nothing` かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isNothing = <T>(value: Maybe<T>): value is Nothing =>
  isMaybe(value) && value === nothing();

/**
 * Checks if the given value is a `Just`.
 * 指定された値が `Just` かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isJust = <T>(value: any): value is Just<T> =>
  isMaybe(value) && value !== nothing();

/**
 * A utility object containing constructors and helpers for `Maybe`.
 * `Maybe` のコンストラクタおよびヘルパーを含むユーティリティオブジェクト。
 */
export const Maybe = {
  pack: maybe,
  just,
  nothing,
  isNone,
  isMaybe,
  isNothing,
  isJust,
} as const;

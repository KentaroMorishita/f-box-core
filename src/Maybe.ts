type None = null | undefined | void;

// 'Maybe' 型
export type Maybe<T> = Just<T> | Nothing;

// 'Just<T>' 型
export type Just<T> = {
  readonly isMaybe: true;
  readonly map: <U>(fn: (value: T) => U) => Maybe<U>;
  readonly apply: <A>(this: Just<(a: A) => T>, boxValue: Maybe<A>) => Maybe<T>;
  readonly flatMap: <U>(fn: (value: T) => Maybe<U>) => Maybe<U>;
  readonly getValue: () => T;
  readonly orElse: (defaultValue: Maybe<T>) => Maybe<T>;
  readonly getOrElse: <U>(defaultValue: U) => T | U;
  readonly match: <U>(onJust: (value: T) => U, onNothing: () => U) => U;
  readonly "<$>": <U>(fn: (value: T) => U) => Maybe<U>;
  readonly "<*>": <A>(this: Just<(a: A) => T>, boxValue: Maybe<A>) => Maybe<T>;
  readonly ">>=": <U>(fn: (value: T) => Maybe<U>) => Maybe<U>;
};

// 'Nothing' 型
export type Nothing = {
  readonly isMaybe: true;
  readonly map: <U>(_fn: (value: any) => U) => Nothing;
  readonly apply: <A>(_this: Nothing, _boxValue: Maybe<A>) => Nothing;
  readonly flatMap: <U>(_fn: (value: any) => Maybe<U>) => Nothing;
  readonly getValue: () => null;
  readonly orElse: <U>(defaultValue: Maybe<U>) => Maybe<U>;
  readonly getOrElse: <U>(defaultValue: U) => U;
  readonly match: <U>(_onJust: (value: any) => U, onNothing: () => U) => U;
  readonly "<$>": <U>(_fn: (value: any) => U) => Nothing;
  readonly "<*>": <A>(_this: Nothing, _boxValue: Maybe<A>) => Nothing;
  readonly ">>=": <U>(_fn: (value: any) => Maybe<U>) => Nothing;
};

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

// 'maybe' コンストラクタ
const maybe = <T>(value: T | None): Maybe<T> => {
  return isNone(value) ? nothing() : just(value as NonNullable<T>);
};

// 'nothing' コンストラクタ
const nothing = (): Nothing => nothingSigleton;

// 'just' コンストラクタ
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

// ヘルパー関数
const isNone = (value: any): value is None =>
  value === null || value === undefined;

const isMaybe = <T>(value: any): value is Maybe<T> =>
  value && typeof value === "object" && value.isMaybe === true;

const isNothing = <T>(value: Maybe<T>): value is Nothing =>
  isMaybe(value) && value === nothing();

const isJust = <T>(value: any): value is Just<T> =>
  isMaybe(value) && value !== nothing();

export const Maybe = {
  pack: maybe,
  just,
  nothing,
  isNone,
  isMaybe,
  isNothing,
  isJust,
} as const;

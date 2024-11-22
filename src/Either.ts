type None = null | undefined | void;
// 'Either' 型
export type Either<L, R> = Left<L> | Right<L, R>;

// 'Left<L>' 型
export type Left<L> = {
  readonly isEither: true;
  readonly map: <U>(_fn: (value: any) => U) => Left<L>;
  readonly apply: <A>(_this: Left<L>, _boxValue: Either<L, A>) => Left<L>;
  readonly flatMap: <U>(_fn: (value: any) => Either<L, U>) => Left<L>;
  readonly getValue: () => L;
  readonly orElse: <U>(defaultValue: Either<L, U>) => Either<L, U>;
  readonly getOrElse: <U>(defaultValue: U) => U;
  readonly match: <U>(
    onLeft: (value: L) => U,
    _onRight: (value: any) => U
  ) => U;
  readonly "<$>": <U>(_fn: (value: any) => U) => Left<L>;
  readonly "<*>": <A>(_this: Left<L>, _boxValue: Either<L, A>) => Left<L>;
  readonly ">>=": <U>(_fn: (value: any) => Either<L, U>) => Left<L>;
};

// 'Right<L, R>' 型
export type Right<L, R> = {
  readonly isEither: true;
  readonly map: <U>(fn: (value: R) => U) => Either<L, U>;
  readonly apply: <A>(
    this: Right<L, (a: A) => R>,
    boxValue: Either<L, A>
  ) => Either<L, R>;
  readonly flatMap: <U>(fn: (value: R) => Either<L, U>) => Either<L, U>;
  readonly getValue: () => R;
  readonly orElse: (defaultValue: Either<L, R>) => Either<L, R>;
  readonly getOrElse: (defaultValue: R) => R;
  readonly match: <U>(_onLeft: (value: L) => U, onRight: (value: R) => U) => U;
  readonly "<$>": <U>(fn: (value: R) => U) => Either<L, U>;
  readonly "<*>": <A>(
    this: Right<L, (a: A) => R>,
    boxValue: Either<L, A>
  ) => Either<L, R>;
  readonly ">>=": <U>(fn: (value: R) => Either<L, U>) => Either<L, U>;
};

// 'left' コンストラクタ
const left = <L>(value: L): Left<L> =>
  ({
    isEither: true,
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
  } as const);

// 'right' コンストラクタ
const right = <L, R>(value: R): Right<L, R> => {
  const map = <U>(fn: (value: R) => U): Either<L, U> => right(fn(value));
  const apply = function <A>(
    this: Right<L, (a: A) => R>,
    boxValue: Either<L, A>
  ): Either<L, R> {
    const fn = this.getValue();
    return isLeft(boxValue) ? boxValue : boxValue.map(fn);
  };
  const flatMap = <U>(fn: (value: R) => Either<L, U>): Either<L, U> =>
    fn(value);
  const getValue = () => value;
  const orElse = (_defaultValue: Either<L, R>): Either<L, R> => right(value);
  const getOrElse = (_defaultValue: R): R => value;
  const match = <U>(_onLeft: (value: L) => U, onRight: (value: R) => U) =>
    onRight(value);

  return {
    isEither: true,
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

// 'either' コンストラクタ
const either = right;

// ヘルパー関数
const isNone = (value: any): value is None =>
  value === null || value === undefined;

const isEither = <L, R>(value: any): value is Either<L, R> =>
  value && typeof value === "object" && value.isEither === true;

const isLeft = <L, R>(value: Either<L, R>): value is Left<L> => {
  return (
    isEither(value) &&
    (
      value.match as (
        onLeft: (l: L) => boolean,
        onRight: (r: R) => boolean
      ) => boolean
    )(
      (l) => !isNone(l),
      () => false
    )
  );
};

const isRight = <L, R>(value: Either<L, R>): value is Right<L, R> => {
  return (
    isEither(value) &&
    (
      value.match as (
        onLeft: (l: L) => boolean,
        onRight: (r: R) => boolean
      ) => boolean
    )(
      () => false,
      (r) => !isNone(r)
    )
  );
};

export const Either = {
  pack: either,
  right,
  left,
  isNone,
  isEither,
  isLeft,
  isRight,
} as const;

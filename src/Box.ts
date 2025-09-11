/**
 * A Box type that encapsulates a value and provides methods to manipulate it.
 * 値を包み込み、操作するためのメソッドを提供する Box 型。
 */
export type Box<T> = {
  readonly isBox: true; // Identifies the object as a Box. / オブジェクトが Box であることを識別。

  /**
   * Applies a function to the value inside the Box and returns a new Box.
   * Box 内の値に関数を適用し、新しい Box を返します。
   * @param fn - A function to apply to the Box value. / Box の値に適用する関数。
   */
  readonly map: <U>(fn: (value: T) => U) => Box<U>;

  /**
   * Applies a function to the value inside the Box and returns a new Box.
   * Alias for `map`.
   * Box 内の値に関数を適用し、新しい Box を返します。
   * `map` のエイリアス。
   * @param fn - A function to apply to the Box value. / Box の値に適用する関数。
   */
  readonly "<$>": <U>(fn: (value: T) => U) => Box<U>;

  /**
   * Applies a boxed function to a boxed value and returns a new Box.
   * Box に包まれた関数を別の Box に適用し、新しい Box を返します。
   * @param boxValue - A Box containing a value to apply the function to.
   *                   / 関数を適用する値を含む Box。
   */
  readonly apply: <A, B>(this: Box<(a: A) => B>, boxValue: Box<A>) => Box<B>;

  /**
   * Applies a boxed function to a boxed value and returns a new Box.
   * Alias for `apply`.
   * Box に包まれた関数を別の Box に適用し、新しい Box を返します。
   * `apply` のエイリアス。
   * @param boxValue - A Box containing a value to apply the function to.
   *                   / 関数を適用する値を含む Box。
   */
  readonly "<*>": <A, B>(this: Box<(a: A) => B>, boxValue: Box<A>) => Box<B>;

  /**
   * Applies a function that returns a Box to the value inside this Box and flattens the result.
   * Box 内の値に Box を返す関数を適用し、その結果を平坦化して返します。
   * @param fn - A function that returns a Box. / Box を返す関数。
   */
  readonly flatMap: <U>(fn: (value: T) => Box<U>) => Box<U>;

  /**
   * Applies a function that returns a Box to the value inside this Box and flattens the result.
   * Alias for `flatMap`.
   * Box 内の値に Box を返す関数を適用し、その結果を平坦化して返します。
   * `flatMap` のエイリアス。
   * @param fn - A function that returns a Box. / Box を返す関数。
   */
  readonly ">>=": <U>(fn: (value: T) => Box<U>) => Box<U>;

  /**
   * Gets the value inside the Box.
   * Box 内の値を取得します。
   */
  readonly getValue: () => T;
};

/**
 * Adapter type for Do's `$` parameter.
 * `$` は `yield* $(Box.pack(...))` のためのアダプタ関数です。
 */
export type $Box = <A>(fa: Box<A>) => Generator<any, A, any>;

/**
 * Creates a new Box containing the given value.
 * 指定された値を含む新しい Box を作成します。
 * @param value - The value to encapsulate. / 包み込む値。
 */
const box = <T>(value: T): Box<T> => {
  const map = <U>(fn: (value: T) => U): Box<U> => box(fn(value));
  const apply = function <A, B>(
    this: Box<(a: A) => B>,
    boxValue: Box<A>
  ): Box<B> {
    const fn = this.getValue();
    return boxValue.map((a) => fn(a));
  };
  const flatMap = <U>(fn: (value: T) => Box<U>): Box<U> => fn(value);
  const getValue = () => value;

  return {
    isBox: true,
    map,
    apply,
    flatMap,
    getValue,
    "<$>": map,
    "<*>": apply,
    ">>=": flatMap,
  } as const;
};

/**
 * Checks if the given value is a Box.
 * 指定された値が Box かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
export const isBox = <T>(value: any): value is Box<T> => value?.isBox === true;

/**
 * Enables a "do notation" for Box, allowing for sequential composition of Box operations.
 * Box に対して「do 記法」を提供し、Box の操作を逐次的に記述できるようにします。
 *
 * @param generatorFunc - A generator function yielding Box values.
 *                        Box の値を `yield` するジェネレータ関数。
 * @returns A Box containing the final computed value.
 *          計算結果を含む Box を返します。
 */
// Adapter pattern support to keep `yield*` inference precise.
const GenBoxSym: unique symbol = Symbol();
type GenBox<A> = { readonly _tag: typeof GenBoxSym; readonly fa: Box<A> };

// Overload 1: legacy style (yield Box<T>)
function Do<T, U>(
  generatorFunc: () => Generator<Box<T>, U | Box<U>, T>
): Box<U>;
// Overload 2: adapter style (yield* $(fa))
function Do<R>(
  g: (
    $: <A>(fa: Box<A>) => Generator<any, A, any>
  ) => Generator<any, R, any>
): Box<R>;
// Implementation
function Do(arg: any): Box<any> {
  if (typeof arg === "function" && arg.length >= 1) {
    const $ = <A>(fa: Box<A>) =>
      (function* (): Generator<GenBox<A>, A, any> {
        return yield { _tag: GenBoxSym, fa } as any;
      })();

    const it = arg($);
    const step = (prev?: unknown): Box<any> => {
      const n = it.next(prev);
      if (n.done) return Box.pack<any>(n.value as any);
      const y = n.value as GenBox<unknown>;
      return y.fa[">>="](step);
    };
    return step(undefined as never);
  }

  const iterator = (arg as () => Generator<Box<any>, any | Box<any>, any>)();
  function step(value?: any): Box<any> {
    const { value: result, done } = iterator.next(value as any);
    return done
      ? Box.isBox(result)
        ? (result as Box<any>)
        : Box.pack<any>(result as any)
      : (result as Box<any>)[">>="](step);
  }

  return step(undefined as never);
}

/**
 * Box utility object containing helpers like `pack` and `isBox`.
 * `pack` や `isBox` を含む Box ユーティリティオブジェクト。
 */
export const Box: {
  do: typeof Do;
  pack: typeof box;
  isBox: typeof isBox;
} = {
  do: Do,
  pack: box,
  isBox,
};

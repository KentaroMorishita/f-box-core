/**
 * A function that observes changes in the value of an RBox.
 * RBox の値の変化を監視するための関数。
 */
export type Observer<T> = (value: T) => void;

/**
 * A Reactive Box type (RBox) that encapsulates a value, supports reactive updates, and provides methods to manipulate it.
 * 値を包み込み、リアクティブな更新をサポートし、操作するためのメソッドを提供する RBox 型。
 */
export type RBox<T> = {
  readonly isRBox: true; // Identifies the object as an RBox. / オブジェクトが RBox であることを識別。

  /**
   * Gets the value inside the RBox.
   * RBox 内の値を取得します。
   */
  readonly getValue: () => T;

  /**
   * Updates the value inside the RBox and notifies all subscribers.
   * RBox 内の値を更新し、すべての購読者に通知します。
   * @param value - A new value or a function to update the value. / 新しい値、または値を更新する関数。
   */
  readonly setValue: ((value: T) => void) & ((value: (prev: T) => T) => void);

  /**
   * Applies a function to the value inside the RBox and returns a new derived RBox.
   * RBox 内の値に関数を適用し、新しい派生 RBox を返します。
   * @param fn - A function to apply to the RBox value. / RBox の値に適用する関数。
   */
  readonly map: <U>(fn: (value: T) => U) => RBox<U>;

  /**
   * Applies a function to the value inside the RBox and returns a new derived RBox.
   * Alias for `map`.
   * RBox 内の値に関数を適用し、新しい派生 RBox を返します。
   * `map` のエイリアス。
   * @param fn - A function to apply to the RBox value. / RBox の値に適用する関数。
   */
  readonly "<$>": <U>(fn: (value: T) => U) => RBox<U>;

  /**
   * Applies a boxed function to a boxed value and returns a new derived RBox.
   * RBox に包まれた関数を別の RBox に適用し、新しい派生 RBox を返します。
   * @param boxValue - An RBox containing a value to apply the function to.
   *                   / 関数を適用する値を含む RBox。
   */
  readonly apply: <A, B>(this: RBox<(a: A) => B>, boxValue: RBox<A>) => RBox<B>;

  /**
   * Applies a boxed function to a boxed value and returns a new derived RBox.
   * Alias for `apply`.
   * RBox に包まれた関数を別の RBox に適用し、新しい派生 RBox を返します。
   * `apply` のエイリアス。
   * @param boxValue - An RBox containing a value to apply the function to.
   *                   / 関数を適用する値を含む RBox。
   */
  readonly "<*>": <A, B>(this: RBox<(a: A) => B>, boxValue: RBox<A>) => RBox<B>;

  /**
   * Applies a function that returns an RBox to the value inside this RBox and flattens the result.
   * RBox 内の値に RBox を返す関数を適用し、その結果を平坦化して返します。
   * @param fn - A function that returns an RBox. / RBox を返す関数。
   */
  readonly flatMap: <U>(fn: (value: T) => RBox<U>) => RBox<U>;

  /**
   * Applies a function that returns an RBox to the value inside this RBox and flattens the result.
   * Alias for `flatMap`.
   * RBox 内の値に RBox を返す関数を適用し、その結果を平坦化して返します。
   * `flatMap` のエイリアス。
   * @param fn - A function that returns an RBox. / RBox を返す関数。
   */
  readonly ">>=": <U>(fn: (value: T) => RBox<U>) => RBox<U>;

  /**
   * Subscribes to updates of the RBox value.
   * RBox の値の更新を購読します。
   * @param observer - A function to handle updates. / 更新を処理する関数。
   * @returns A unique key to identify the subscription. / 購読を識別するための一意のキー。
   */
  readonly subscribe: (observer: Observer<T>) => string;

  /**
   * Unsubscribes from updates using the subscription key.
   * 購読キーを使用して更新の購読を解除します。
   * @param key - The subscription key. / 購読キー。
   */
  readonly unsubscribe: (key: string) => void;

  /**
   * Unsubscribes all observers from this RBox.
   * この RBox に登録されたすべての購読者を解除します。
   */
  readonly unsubscribeAll: () => void;

  /**
   * Detaches the RBox from all dependencies and stops updates to derived RBoxes.
   * RBox をすべての依存関係から切り離し、派生 RBox への更新を停止します。
   */
  readonly detach: () => void;

  /**
   * A collection of handlers to call when detaching.
   * Detach 時に呼び出すハンドラーのコレクション。
   */
  readonly detachHandlers: (() => void)[];
};

/**
 * Creates a new RBox with an initial value.
 * 初期値を持つ新しい RBox を作成します。
 * @param initialValue - The initial value for the RBox. / RBox の初期値。
 */
const rbox = <T>(initialValue: T): RBox<T> => {
  let value: T = initialValue;
  const observers: Map<string, Observer<T>> = new Map();
  const detachHandlers: (() => void)[] = [];

  const notify = () => {
    observers.forEach((observer) => observer(value));
  };

  const getValue = () => value;
  const setValue = (newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === "function") {
      value = (newValue as (prev: T) => T)(value);
    } else {
      value = newValue;
    }
    notify();
  };

  const map = <U>(fn: (value: T) => U): RBox<U> => {
    const derivedBox = rbox(fn(value));
    const observerKey = subscribe((newValue) => {
      derivedBox.setValue(fn(newValue));
    });

    derivedBox.detachHandlers.push(() => unsubscribe(observerKey));
    return derivedBox;
  };

  const flatMap = <U>(fn: (value: T) => RBox<U>): RBox<U> => {
    let innerBox = fn(value);
    const derivedBox = rbox(innerBox.getValue());

    const updateInnerBox = (newValue: T) => {
      innerBox.detach();
      innerBox = fn(newValue);
      derivedBox.setValue(innerBox.getValue());
      const innerObserverKey = innerBox.subscribe((innerValue) => {
        derivedBox.setValue(innerValue);
      });
      derivedBox.detachHandlers.push(() =>
        innerBox.unsubscribe(innerObserverKey)
      );
    };

    const observerKey = subscribe(updateInnerBox);
    derivedBox.detachHandlers.push(() => unsubscribe(observerKey));

    const innerObserverKey = innerBox.subscribe((innerValue) => {
      derivedBox.setValue(innerValue);
    });
    derivedBox.detachHandlers.push(() =>
      innerBox.unsubscribe(innerObserverKey)
    );

    return derivedBox;
  };

  const apply = function <A, B>(
    this: RBox<(a: A) => B>,
    boxValue: RBox<A>
  ): RBox<B> {
    const derivedBox = rbox(this.getValue()(boxValue.getValue()));

    const handleChange = () =>
      derivedBox.setValue(this.getValue()(boxValue.getValue()));
    const observerKeys = [
      this.subscribe(handleChange),
      boxValue.subscribe(handleChange),
    ];

    derivedBox.detachHandlers.push(() => {
      this.unsubscribe(observerKeys[0]);
      boxValue.unsubscribe(observerKeys[1]);
    });

    return derivedBox;
  };

  const subscribe = (observer: Observer<T>): string => {
    const key = Math.random().toString(36).substr(2, 9);
    observers.set(key, observer);
    return key;
  };

  const unsubscribe = (key: string): void => {
    observers.delete(key);
  };

  const unsubscribeAll = (): void => {
    observers.clear();
  };

  const detach = () => {
    detachHandlers.forEach((handler) => handler());
    detachHandlers.length = 0;
  };

  return {
    isRBox: true,
    getValue,
    setValue,
    map,
    flatMap,
    apply,
    "<$>": map,
    ">>=": flatMap,
    "<*>": apply,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    detach,
    detachHandlers,
  };
};

/**
 * Updates the value of an RBox directly or with a callback.
 * RBox の値を直接更新、またはコールバック関数を用いて更新します。
 * @param box - The RBox to update. / 更新する RBox。
 * @returns A function to set the value or update using a callback.
 *          値を設定する関数、またはコールバックで更新する関数を返します。
 */
export const set =
  <T>(box: RBox<T>) =>
  (value: T | ((prev: T) => T)) => {
    if (typeof value === "function") {
      box.setValue(value as (prev: T) => T);
    } else {
      box.setValue(value);
    }
  };

/**
 * Checks if the given value is an RBox.
 * 指定された値が RBox かどうかを判定します。
 * @param value - The value to check. / 判定する値。
 */
const isRBox = <T>(value: any): value is RBox<T> =>
  value && typeof value === "object" && (value as RBox<T>).isRBox === true;

/**
 * Enables a "do notation" for RBox, allowing for sequential composition of RBox operations.
 * RBox に対して「do 記法」を提供し、RBox の操作を逐次的に記述できるようにします。
 *
 * @param generatorFunc - A generator function yielding RBox values.
 *                        RBox の値を `yield` するジェネレータ関数。
 * @returns An RBox containing the final computed value.
 *          計算結果を含む RBox を返します。
 */
function Do<T, U>(
  generatorFunc: () => Generator<RBox<T>, U | RBox<U>, T>
): RBox<U> {
  const iterator = generatorFunc();
  function step(value?: T): RBox<U> {
    const { value: result, done } = iterator.next(value as T);
    return done
      ? RBox.isRBox(result)
        ? (result as RBox<U>)
        : RBox.pack<U>(result as U)
      : result[">>="](step);
  }

  return step(undefined as never);
}

/**
 * RBox utility object containing helpers like `pack`, `set`, and `isRBox`.
 * `pack`、`set`、`isRBox` を含む RBox ユーティリティオブジェクト。
 */
export const RBox = {
  do: Do,
  pack: rbox,
  set,
  isRBox,
} as const;

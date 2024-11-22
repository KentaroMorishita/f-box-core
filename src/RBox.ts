export type Observer<T> = (value: T) => void;

export type RBox<T> = {
  readonly isRBox: true;
  readonly getValue: () => T;
  readonly setValue: (fn: (value: T) => T) => void;
  readonly map: <U>(fn: (value: T) => U) => RBox<U>;
  readonly apply: <A, B>(this: RBox<(a: A) => B>, boxValue: RBox<A>) => RBox<B>;
  readonly flatMap: <U>(fn: (value: T) => RBox<U>) => RBox<U>;
  readonly "<$>": <U>(fn: (value: T) => U) => RBox<U>;
  readonly "<*>": <A, B>(this: RBox<(a: A) => B>, boxValue: RBox<A>) => RBox<B>;
  readonly ">>=": <U>(fn: (value: T) => RBox<U>) => RBox<U>;
  readonly subscribe: (observer: Observer<T>) => string;
  readonly unsubscribe: (key: string) => void;
  readonly unsubscribeAll: () => void;
  readonly detach: () => void;
  readonly detachHandlers: (() => void)[];
};

const rbox = <T>(initialValue: T): RBox<T> => {
  let value: T = initialValue;
  const observers: Map<string, Observer<T>> = new Map();
  const detachHandlers: (() => void)[] = [];

  const notify = () => {
    observers.forEach((observer) => observer(value));
  };

  const getValue = () => value;
  const setValue = (fn: (value: T) => T) => {
    value = fn(value);
    notify();
  };

  const map = <U>(fn: (value: T) => U): RBox<U> => {
    const derivedBox = rbox(fn(value));
    const observerKey = subscribe((newValue) => {
      derivedBox.setValue(() => fn(newValue));
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
      derivedBox.setValue(() => innerBox.getValue());
      const innerObserverKey = innerBox.subscribe((innerValue) => {
        derivedBox.setValue(() => innerValue);
      });
      derivedBox.detachHandlers.push(() =>
        innerBox.unsubscribe(innerObserverKey)
      );
    };

    const observerKey = subscribe(updateInnerBox);
    derivedBox.detachHandlers.push(() => unsubscribe(observerKey));

    const innerObserverKey = innerBox.subscribe((innerValue) => {
      derivedBox.setValue(() => innerValue);
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
      derivedBox.setValue(() => this.getValue()(boxValue.getValue()));
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

export const set =
  <T>(box: RBox<T>) =>
  (value: T) =>
    box.setValue(() => value);

const isRBox = <T>(value: any): value is RBox<T> =>
  value && typeof value === "object" && (value as RBox<T>).isRBox === true;

export const RBox = {
  pack: rbox,
  set,
  isRBox,
} as const;

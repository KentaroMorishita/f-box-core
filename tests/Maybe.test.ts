import { Maybe } from "../src/Maybe";

describe("Maybe laws and behavior", () => {
  /**
   * ファンクター則のテスト。
   * 1. 恒等則（Identity）
   *    - map（<$>）に恒等関数を適用しても値が変化しないことを確認。
   * 2. 合成則（Composition）
   *    - 2つの関数を合成してmapに渡す場合と、個別にmapを適用した場合の結果が等しいことを確認。
   */
  describe("Functor laws", () => {
    test("Identity", () => {
      const identity = <T>(x: T) => x;
      const value = 42;
      const maybe = Maybe.just(value);

      // Identity: `<$>` id = id
      expect(maybe["<$>"](identity).getValue()).toBe(maybe.getValue());
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const value = 42;
      const maybe = Maybe.just(value);

      // Composition: `<$>` (f . g) = (`<$>` f) . (`<$>` g)
      const composed = (x: number) => f(g(x));
      expect(maybe["<$>"](composed).getValue()).toBe(
        maybe["<$>"](g)["<$>"](f).getValue()
      );
    });
  });

  /**
   * アプリカティブ則のテスト。
   * 1. 恒等則（Identity）
   *    - pure(id) <*> v = v
   * 2. 準同型則（Homomorphism）
   *    - pure(f) <*> pure(x) = pure(f(x))
   * 3. 交換則（Interchange）
   *    - u <*> pure(y) = pure(f => f(y)) <*> u
   * 4. 合成則（Composition）
   *    - pure(.) <*> u <*> v <*> w = u <*> (v <*> w)
   */
  describe("Applicative laws", () => {
    test("Identity", () => {
      // 型注釈を明示する
      const identity = (x: number) => x;
      const pure = Maybe.just;
      const value = 42;
      const maybe = Maybe.just<number>(value);

      // Identity: pure id <*> v = v
      expect(pure(identity)["<*>"](maybe).getValue()).toBe(maybe.getValue());
    });

    test("Homomorphism", () => {
      const f = (x: number) => x + 1;
      const pure = Maybe.just;
      const value: number = 42;

      // Homomorphism: pure f <*> pure x = pure (f x)
      expect(pure(f)["<*>"](pure(value)).getValue()).toBe(
        pure(f(value)).getValue()
      );
    });
    test("Interchange", () => {
      const f = (x: number) => x + 1;
      const pure = Maybe.just;
      const u = Maybe.just(f);
      const value: number = 42;

      // Interchange: u <*> pure y = pure (f => f(y)) <*> u
      expect(u["<*>"](pure(value)).getValue()).toBe(
        pure((fn: (a: number) => number) => fn(value))
          ["<*>"](u)
          .getValue()
      );
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const pure = Maybe.just;
      const value = 42;

      type F = typeof f;
      type G = typeof g;
      type X = number;

      const u = Maybe.just<F>(f);
      const v = Maybe.just<G>(g);
      const w = Maybe.just<X>(value);

      // Composition: pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
      const composition = (f: F) => (g: G) => (x: X) => f(g(x));
      expect(pure(composition)["<*>"](u)["<*>"](v)["<*>"](w).getValue()).toBe(
        u["<*>"](v["<*>"](w)).getValue()
      );
    });
  });

  /**
   * モナド則のテスト。
   * 1. 左単位元則（Left identity）
   *    - return a >>= f = f a
   * 2. 右単位元則（Right identity）
   *    - m >>= return = m
   * 3. 結合則（Associativity）
   *    - (m >>= f) >>= g = m >>= (x -> f x >>= g)
   */
  describe("Monad laws", () => {
    test("Left identity", () => {
      const f = (x: number) => Maybe.just(x + 1);
      const value = 42;

      // Left identity: return a >>= f = f a
      expect(Maybe.just(value)[">>="](f).getValue()).toBe(f(value).getValue());
    });

    test("Right identity", () => {
      const value = 42;
      const maybe = Maybe.just(value);

      // Right identity: m >>= return = m
      expect(maybe[">>="](Maybe.just).getValue()).toBe(maybe.getValue());
    });

    test("Associativity", () => {
      const f = (x: number) => Maybe.just(x + 1);
      const g = (x: number) => Maybe.just(x * 2);
      const value = 42;
      const maybe = Maybe.just(value);

      // Associativity: (m >>= f) >>= g = m >>= (\x -> f x >>= g)
      expect(maybe[">>="](f)[">>="](g).getValue()).toBe(
        maybe[">>="]((x: number) => f(x)[">>="](g)).getValue()
      );
    });
  });

  /**
   * 特殊ケースのテスト。
   * 1. Nothing の挙動確認。
   * 2. Just から Nothing への遷移確認。
   * 3. match 関数の挙動確認。
   */
  describe("Edge case handling", () => {
    test("Nothing remains Nothing", () => {
      const nothing = Maybe.nothing();

      expect(nothing["<$>"]((x) => x).getValue()).toBe(null);
      expect(nothing["<*>"](Maybe.just(42)).getValue()).toBe(null);
      expect(nothing[">>="](() => Maybe.just(42)).getValue()).toBe(null);
    });

    test("Just transitions to Nothing", () => {
      const maybe = Maybe.pack<number | null>(null);

      expect(Maybe.isNothing(maybe)).toBe(true);
    });

    test("match function works correctly", () => {
      const just = Maybe.just(42);
      const nothing = Maybe.nothing();

      expect(
        just.match(
          (value) => `Just ${value}`,
          () => "Nothing"
        )
      ).toBe("Just 42");

      expect(
        nothing.match(
          (value) => `Just ${value}`,
          () => "Nothing"
        )
      ).toBe("Nothing");
    });
  });
});

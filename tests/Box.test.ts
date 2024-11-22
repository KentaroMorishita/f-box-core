import { Box } from "../src/Box";

describe("Box laws", () => {
  /**
   * ファンクター則のテスト。
   * 1. 恒等則（Identity）
   *    - map（<$>）に恒等関数を適用しても値が変化しないことを確認。
   * 2. 合成則（Composition）
   *    - 2つの関数を合成してmapに渡す場合と、個別にmapを適用した場合の結果が等しいことを確認。
   */
  describe("Functor laws", () => {
    test("Identity", () => {
      const identity = (x: number) => x;
      const value = 10;
      const box = Box.pack(value);

      // Identity: `<$>` id = id
      expect(box["<$>"](identity).getValue()).toBe(box.getValue());
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const value = 10;
      const box = Box.pack(value);

      // Composition: `<$>` (f . g) = (`<$>` f) . (`<$>` g)
      const composed = (x: number) => f(g(x));
      expect(box["<$>"](composed).getValue()).toBe(
        box["<$>"](g)["<$>"](f).getValue()
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
      const identity = (x: number) => x;
      const pure = Box.pack;
      const value = 10;
      const box = Box.pack(value);

      // Identity: pure id <*> v = v
      expect(pure(identity)["<*>"](box).getValue()).toBe(box.getValue());
    });

    test("Homomorphism", () => {
      const f = (x: number) => x + 1;
      const pure = Box.pack;
      const value = 10;

      // Homomorphism: pure f <*> pure x = pure (f x)
      expect(pure(f)["<*>"](pure(value)).getValue()).toBe(
        pure(f(value)).getValue()
      );
    });

    test("Interchange", () => {
      const f = (x: number) => x + 1;
      const pure = Box.pack;
      const u = Box.pack(f);
      const value = 10;

      // Interchange: u <*> pure y = pure ($ y) <*> u
      expect(u["<*>"](pure(value)).getValue()).toBe(
        pure((fn: (a: number) => number) => fn(value))
          ["<*>"](u)
          .getValue()
      );
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const pure = Box.pack;
      const value = 10;
      const u = Box.pack(f);
      const v = Box.pack(g);
      const w = Box.pack(value);

      // Composition: pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
      const composition = (f: Function) => (g: Function) => (x: any) => f(g(x));
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
      const f = (x: number) => Box.pack(x + 1);
      const value = 10;

      // Left identity: return a >>= f = f a
      expect(Box.pack(value)[">>="](f).getValue()).toBe(f(value).getValue());
    });

    test("Right identity", () => {
      const value = 10;
      const m = Box.pack(value);

      // Right identity: m >>= return = m
      expect(m[">>="](Box.pack).getValue()).toBe(m.getValue());
    });

    test("Associativity", () => {
      const f = (x: number) => Box.pack(x + 1);
      const g = (x: number) => Box.pack(x * 2);
      const value = 10;
      const m = Box.pack(value);

      // Associativity: (m >>= f) >>= g = m >>= (\x -> f x >>= g)
      expect(m[">>="](f)[">>="](g).getValue()).toBe(
        m[">>="]((x: number) => f(x)[">>="](g)).getValue()
      );
    });
  });
});

import { RBox, set } from "../src/RBox";

describe("RBox laws and behavior", () => {
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
      const rbox = RBox.pack(value);

      // Identity: `<$>` id = id
      expect(rbox["<$>"](identity).getValue()).toBe(rbox.getValue());
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const value = 10;
      const rbox = RBox.pack(value);

      // Composition: `<$>` (f . g) = (`<$>` f) . (`<$>` g)
      const composed = (x: number) => f(g(x));
      expect(rbox["<$>"](composed).getValue()).toBe(
        rbox["<$>"](g)["<$>"](f).getValue()
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
      const pure = RBox.pack;
      const value = 10;
      const rbox = RBox.pack(value);

      // Identity: pure id <*> v = v
      expect(pure(identity)["<*>"](rbox).getValue()).toBe(rbox.getValue());
    });

    test("Homomorphism", () => {
      const f = (x: number) => x + 1;
      const pure = RBox.pack;
      const value = 10;

      // Homomorphism: pure f <*> pure x = pure(f(x))
      expect(pure(f)["<*>"](pure(value)).getValue()).toBe(
        pure(f(value)).getValue()
      );
    });

    test("Interchange", () => {
      const f = (x: number) => x + 1;
      const pure = RBox.pack;
      const u = RBox.pack(f);
      const value = 10;

      // Interchange: u <*> pure y = pure(f => f(y)) <*> u
      expect(u["<*>"](pure(value)).getValue()).toBe(
        pure((fn: (a: number) => number) => fn(value))
          ["<*>"](u)
          .getValue()
      );
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const pure = RBox.pack;
      const value = 10;

      type F = typeof f;
      type G = typeof g;
      type X = number;

      const u = RBox.pack<F>(f);
      const v = RBox.pack<G>(g);
      const w = RBox.pack<X>(value);

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
      const f = (x: number) => RBox.pack(x + 1);
      const value = 10;

      // Left identity: return a >>= f = f a
      expect(RBox.pack(value)[">>="](f).getValue()).toBe(f(value).getValue());
    });

    test("Right identity", () => {
      const value = 10;
      const rbox = RBox.pack(value);

      // Right identity: m >>= return = m
      expect(rbox[">>="](RBox.pack).getValue()).toBe(rbox.getValue());
    });

    test("Associativity", () => {
      const f = (x: number) => RBox.pack(x + 1);
      const g = (x: number) => RBox.pack(x * 2);
      const value = 10;
      const rbox = RBox.pack(value);

      // Associativity: (m >>= f) >>= g = m >>= (x -> f x >>= g)
      expect(rbox[">>="](f)[">>="](g).getValue()).toBe(
        rbox[">>="]((x: number) => f(x)[">>="](g)).getValue()
      );
    });
  });

  /**
   * リアクティブ性のテスト。
   * 1. 購読（subscribe）と通知（notify）が正しく動作することを確認。
   * 2. 購読解除（unsubscribe, unsubscribeAll）で通知が停止することを確認。
   * 3. map を使った派生ボックスのリアクティブ性を確認。
   * 4. detach を使用して派生ボックスを元のボックスから切り離せることを確認。
   * 5. すべての購読を解除した後でも再購読が可能であることを確認。
   */
  describe("Reactivity", () => {
    /**
     * 購読が正しく動作し、値の更新が通知されることを確認。
     */
    test("Subscribers receive updates", () => {
      const rbox = RBox.pack(0);
      let observedValue = 0;

      const key = rbox.subscribe((value) => {
        observedValue = value;
      });

      rbox.setValue(10); // 直接値を設定
      expect(observedValue).toBe(10);

      rbox.setValue((prev) => prev + 5); // コールバックで更新
      expect(observedValue).toBe(15);

      rbox.unsubscribe(key);
      rbox.setValue(20);
      expect(observedValue).toBe(15); // 解除後は値が変わらない
    });

    /**
     * mapを使った派生ボックスが元のボックスの更新を正しく反映することを確認。
     */
    test("Derived boxes react to changes", () => {
      const rbox = RBox.pack(2);
      const derived = rbox.map((x) => x * 3);

      expect(derived.getValue()).toBe(6);

      rbox.setValue(4); // 直接値を設定
      expect(derived.getValue()).toBe(12);

      rbox.setValue((prev) => prev + 2); // コールバックで更新
      expect(derived.getValue()).toBe(18);
    });

    /**
     * detachを呼び出すことで、派生ボックスが元のボックスの更新を受け取らなくなることを確認。
     */
    test("detach removes derived box subscriptions", () => {
      const rbox = RBox.pack(0);
      const derived = rbox.map((x) => x + 1);

      derived.detach(); // 派生ボックスをdetach
      rbox.setValue(5);

      expect(derived.getValue()).toBe(1); // 初期値 + 1 のまま更新されない
    });

    /**
     * unsubscribeAllを呼び出すことで、元のボックスに登録されたすべての購読が解除されることを確認。
     */
    test("unsubscribeAll removes all observers", () => {
      const rbox = RBox.pack(0);
      let observer1Called = false;
      let observer2Called = false;

      // 2つの購読を追加
      rbox.subscribe(() => {
        observer1Called = true;
      });
      rbox.subscribe(() => {
        observer2Called = true;
      });

      // 全購読解除
      rbox.unsubscribeAll();

      // 値を更新しても購読が呼び出されないことを確認
      rbox.setValue(1);
      expect(observer1Called).toBe(false);
      expect(observer2Called).toBe(false);
    });

    /**
     * すべての購読を解除した後でも再購読が可能であることを確認。
     */
    test("unsubscribeAll allows re-subscription", () => {
      const rbox = RBox.pack(0);
      let observerCalled = false;

      // 購読と解除
      const key = rbox.subscribe(() => {
        observerCalled = true;
      });
      rbox.unsubscribe(key);

      // 再購読
      rbox.subscribe(() => {
        observerCalled = true;
      });

      // 値を更新して購読が呼び出されることを確認
      rbox.setValue(1);
      expect(observerCalled).toBe(true);
    });

    /**
     * set ヘルパーが直接値とコールバック関数の両方に対応していることを確認。
     */
    test("set helper supports both direct values and callbacks", () => {
      const rbox = RBox.pack(0);

      // 値を直接設定
      set(rbox)(10);
      expect(rbox.getValue()).toBe(10);

      // コールバック関数で値を更新
      set(rbox)((prev) => prev + 5);
      expect(rbox.getValue()).toBe(15);
    });
  });
});

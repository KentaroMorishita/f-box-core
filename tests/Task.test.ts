import { Task } from "../src/Task";

describe("Task laws", () => {
  /**
   * ファンクター則のテスト。
   * 1. 恒等則（Identity）
   *    - map（<$>）に恒等関数を適用しても値が変化しないことを確認。
   * 2. 合成則（Composition）
   *    - 2つの関数を合成してmapに渡す場合と、個別にmapを適用した場合の結果が等しいことを確認。
   */
  describe("Functor laws", () => {
    test("Identity", async () => {
      const identity = (x: number) => x;
      const task = Task.lift(10);

      // Identity: `<$>` id = id
      const result = await task["<$>"](identity).run();
      expect(result).toBe(await task.run());
    });

    test("Composition", async () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const composed = (x: number) => f(g(x));
      const task = Task.lift(10);

      // Composition: `<$>` (f . g) = (`<$>` f) . (`<$>` g)
      const result = await task["<$>"](composed).run();
      const chained = await task["<$>"](g)["<$>"](f).run();
      expect(result).toBe(chained);
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
    test("Identity", async () => {
      const identity = (x: number) => x;
      const task = Task.lift(10);

      // Identity: pure id <*> v = v
      const result = await Task.lift(identity)["<*>"](task).run();
      expect(result).toBe(await task.run());
    });

    test("Homomorphism", async () => {
      const f = (x: number) => x + 1;

      // Homomorphism: pure f <*> pure x = pure (f x)
      const result = await Task.lift(f)["<*>"](Task.lift(10)).run();
      expect(result).toBe(await Task.lift(f(10)).run());
    });

    test("Interchange", async () => {
      const f = (x: number) => x + 1;
      const taskFn = Task.lift(f);

      // Interchange: u <*> pure y = pure ($ y) <*> u
      const result = await taskFn["<*>"](Task.lift(10)).run();
      const swapped = await Task.lift((fn: (x: number) => number) => fn(10))
        ["<*>"](taskFn)
        .run();
      expect(result).toBe(swapped);
    });

    test("Composition", async () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const taskValue = Task.lift(10);
      const taskF = Task.lift(f);
      const taskG = Task.lift(g);

      // Composition: pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
      const composed = Task.lift((f: any) => (g: any) => (x: any) => f(g(x)));
      const left = await composed["<*>"](taskF)
        ["<*>"](taskG)
        ["<*>"](taskValue)
        .run();
      const right = await taskF["<*>"](taskG["<*>"](taskValue)).run();
      expect(left).toBe(right);
    });
  });

  /**
   * モナド則のテスト。
   * 1. 左単位元則（Left identity）
   *    - return a >>= f = f a
   * 2. 右単位元則（Right identity）
   *    - m >>= return = m
   * 3. 結合則（Associativity）
   *    - (m >>= f) >>= g = m >>= (\x -> f x >>= g)
   */
  describe("Monad laws", () => {
    test("Left identity", async () => {
      const f = (x: number) => Task.lift(x + 1);
      const value = 10;

      // Left identity: return a >>= f = f a
      const result = await Task.lift(value)[">>="](f).run();
      expect(result).toBe(await f(value).run());
    });

    test("Right identity", async () => {
      const task = Task.lift(10);

      // Right identity: m >>= return = m
      const result = await task[">>="](Task.lift).run();
      expect(result).toBe(await task.run());
    });

    test("Associativity", async () => {
      const f = (x: number) => Task.lift(x + 1);
      const g = (x: number) => Task.lift(x * 2);
      const task = Task.lift(10);

      // Associativity: (m >>= f) >>= g = m >>= (\x -> f x >>= g)
      const left = await task[">>="](f)[">>="](g).run();
      const right = await task[">>="]((x) => f(x)[">>="](g)).run();
      expect(left).toBe(right);
    });
  });

  /**
   * 特殊ケースのテスト。
   * 1. map や flatMap で例外がスローされても適切に伝播されるかを確認。
   */
  describe("Edge case handling", () => {
    test("map propagates errors", async () => {
      const throwingFn = () => {
        throw new Error("Map error");
      };
      const task = Task.lift(10);

      await expect(task["<$>"](throwingFn).run()).rejects.toThrow("Map error");
    });

    test("flatMap propagates errors", async () => {
      const throwingFn = () => {
        throw new Error("FlatMap error");
      };
      const task = Task.lift(10);

      await expect(task[">>="](throwingFn).run()).rejects.toThrow(
        "FlatMap error"
      );
    });

    test("apply propagates errors", async () => {
      const throwingFnTask = Task.lift(() => {
        throw new Error("Apply error");
      });
      const valueTask = Task.lift(10);

      await expect(throwingFnTask["<*>"](valueTask).run()).rejects.toThrow(
        "Apply error"
      );
    });
  });
});

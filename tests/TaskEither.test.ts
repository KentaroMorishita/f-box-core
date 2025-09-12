import { TaskEither } from "../src/TaskEither";
import type { $TaskEither } from "../src/TaskEither";
import { Task } from "../src/Task";
import { Either } from "../src/Either";

describe("TaskEither basics", () => {
  test("map maps Right and preserves Left", async () => {
    const r = TaskEither.right<string, number>(1).map((n) => n + 1);
    const e1 = await r.run();
    expect(e1.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:2");

    const l = TaskEither.left<string, number>("err").map((n) => n + 1);
    const e2 = await l.run();
    expect(e2.match(
      (l) => `L:${l}`,
      () => "R"
    )).toBe("L:err");
  });

  test("flatMap binds Right and short-circuits Left", async () => {
    const a = TaskEither.right<string, number>(1)
      .flatMap((x) => TaskEither.right<string, number>(x + 1));
    const ea = await a.run();
    expect(ea.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:2");

    const b = TaskEither.left<string, number>("boom").flatMap((x) =>
      TaskEither.right<string, number>(x + 1)
    );
    const eb = await b.run();
    expect(eb.match(
      (l) => `L:${l}`,
      () => "R"
    )).toBe("L:boom");
  });

  test("apply applies function in Right and propagates Left", async () => {
    const tf = TaskEither.right<string, (n: number) => number>((n) => n + 2);
    const tv = TaskEither.right<string, number>(10);
    const res = await tf["<*>"](tv).run();
    expect(res.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:12");

    const lf = TaskEither.left<string, (n: number) => number>("badf");
    const lv = TaskEither.right<string, number>(10);
    const res2 = await lf["<*>"](lv).run();
    expect(res2.match(
      (l) => `L:${l}`,
      () => "R"
    )).toBe("L:badf");
  });
});

describe("Interoperability", () => {
  test("fromTask lifts as Right", async () => {
    const te = TaskEither.fromTask<string, number>(Task.pack(5));
    const e = await te.run();
    expect(e.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:5");
  });

  test("fromEither lifts Either", async () => {
    const te1 = TaskEither.fromEither<string, number>(Either.right(7));
    const e1 = await te1.run();
    expect(e1.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:7");

    const te2 = TaskEither.fromEither<string, number>(Either.left("err"));
    const e2 = await te2.run();
    expect(e2.match(
      (l) => `L:${l}`,
      () => "R"
    )).toBe("L:err");
  });

  test("tryCatch maps errors to Left", async () => {
    const ok = TaskEither.tryCatch(
      async () => 10,
      () => "e"
    );
    const e1 = await ok.run();
    expect(e1.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:10");

    const ng = TaskEither.tryCatch(
      async () => Promise.reject(new Error("x")),
      (err) => String(err.message || err)
    );
    const e2 = await ng.run();
    expect(e2.match(
      (l) => `L:${l}`,
      () => "R"
    )).toBe("L:x");
  });
});

describe("match", () => {
  test("returns Task<U> selecting branch", async () => {
    const t1 = TaskEither.right<string, number>(3).match(
      () => 0,
      (r) => r + 1
    );
    await expect(t1.run()).resolves.toBe(4);

    const t2 = TaskEither.left<string, number>("e").match(
      () => 123,
      () => 0
    );
    await expect(t2.run()).resolves.toBe(123);
  });
});

describe("Do notation", () => {
  test("legacy yield style", async () => {
    const te = TaskEither.do<string, number>(function* () {
      const a: number = yield TaskEither.right<string, number>(1);
      const b: number = yield TaskEither.right<string, number>(2);
      return a + b;
    });
    const e = await te.run();
    expect(e.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:3");
  });

  test("$ adapter with yield*", async () => {
    const te = TaskEither.do<string, number>(function* ($: $TaskEither<string>) {
      const a = yield* $(TaskEither.right<string, number>(1));
      const b = yield* $(TaskEither.right<string, number>(a + 2));
      return a + b; // 1 + 3 = 4
    });
    const e = await te.run();
    expect(e.match(
      () => "L",
      (x) => `R:${x}`
    )).toBe("R:4");
  });
});


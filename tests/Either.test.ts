import { Either } from "../src/Either";

describe("Either laws", () => {
  describe("Functor laws", () => {
    test("Identity", () => {
      const identity = (x: number) => x;
      const value = 42;
      const right = Either.right(value);

      // Identity: `<$>` id = id
      expect(right["<$>"](identity).getValue()).toBe(right.getValue());
    });

    test("Composition", () => {
      const f = (x: number) => x + 1;
      const g = (x: number) => x * 2;
      const value = 42;
      const right = Either.right(value);

      // Composition: `<$>` (f . g) = (`<$>` f) . (`<$>` g)
      const composed = (x: number) => f(g(x));
      expect(right["<$>"](composed).getValue()).toBe(
        right["<$>"](g)["<$>"](f).getValue()
      );
    });
  });

  describe("Applicative laws", () => {
    test("Identity", () => {
      const identity = (x: number) => x;
      const pure = Either.right;
      const value = 42;
      const right = Either.right(value);

      // Identity: pure id <*> v = v
      expect(pure(identity)["<*>"](right).getValue()).toBe(right.getValue());
    });

    test("Homomorphism", () => {
      const f = (x: number) => x + 1;
      const pure = Either.right;
      const value = 42;

      // Homomorphism: pure f <*> pure x = pure (f x)
      expect(pure(f)["<*>"](pure(value)).getValue()).toBe(
        pure(f(value)).getValue()
      );
    });

    test("Interchange", () => {
      const f = (x: number) => x + 1;
      const pure = Either.right;
      const u = Either.right(f);
      const value = 42;

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
      const pure = Either.right;
      const value = 42;

      type F = typeof f;
      type G = typeof g;
      type X = number;

      const u = Either.right<unknown, F>(f);
      const v = Either.right<unknown, G>(g);
      const w = Either.right<unknown, X>(value);

      // Composition: pure (.) <*> u <*> v <*> w = u <*> (v <*> w)
      const composition = (f: F) => (g: G) => (x: X) => f(g(x));
      expect(pure(composition)["<*>"](u)["<*>"](v)["<*>"](w).getValue()).toBe(
        u["<*>"](v["<*>"](w)).getValue()
      );
    });
  });

  describe("Monad laws", () => {
    test("Left identity", () => {
      const f = (x: number) => Either.right(x + 1);
      const value = 42;

      // Left identity: return a >>= f = f a
      expect(Either.right(value)[">>="](f).getValue()).toBe(
        f(value).getValue()
      );
    });

    test("Right identity", () => {
      const value = 42;
      const m = Either.right(value);

      // Right identity: m >>= return = m
      expect(m[">>="](Either.right).getValue()).toBe(m.getValue());
    });

    test("Associativity", () => {
      const f = (x: number) => Either.right(x + 1);
      const g = (x: number) => Either.right(x * 2);
      const value = 42;
      const m = Either.right(value);

      // Associativity: (m >>= f) >>= g = m >>= (\x -> f x >>= g)
      expect(m[">>="](f)[">>="](g).getValue()).toBe(
        m[">>="]((x: number) => f(x)[">>="](g)).getValue()
      );
    });
  });

  describe("Edge case handling", () => {
    test("map propagates for Left", () => {
      const f = (x: number) => x + 1;
      const left = Either.left<string, number>("Error");

      // map with Left does nothing
      expect(left["<$>"](f).getValue()).toBe(left.getValue());
    });

    test("apply propagates Left", () => {
      const f = Either.left<string, (a: number) => number>("Error");
      const value = Either.right<string, number>(42);

      // apply with Left function returns Left
      expect(f["<*>"](value).getValue()).toBe(f.getValue());
    });

    test("flatMap propagates Left", () => {
      const f = (_: string) => Either.right<string, string>("Success");
      const left = Either.left<string, string>("Error");

      // flatMap with Left does nothing
      expect(left[">>="](f).getValue()).toBe(left.getValue());
    });
  });

  describe("Either orElse and getOrElse", () => {
    test("<?> (orElse alias) with Right", () => {
      const right = Either.right<string, number>(42);
      const fallback = Either.right<string, number>(99);

      // `<?>` (orElse alias) should return the current Right
      expect(right["<?>"](fallback).getValue()).toBe(42);
    });

    test("<?> (orElse alias) with Left", () => {
      const left = Either.left<string, number>("Error");
      const fallback = Either.right<string, number>(99);

      // `<?>` (orElse alias) should return the fallback for Left
      expect(left["<?>"](fallback).getValue()).toBe(99);
    });

    test("<|> (getOrElse alias) with Right", () => {
      const right = Either.right<string, number>(42);
      const fallback = 99;

      // `<|>` (getOrElse alias) should return the value inside Right
      expect(right["<|>"](fallback)).toBe(42);
    });

    test("<|> (getOrElse alias) with Left", () => {
      const left = Either.left<string, number>("Error");
      const fallback = 99;

      // `<|>` (getOrElse alias) should return the fallback for Left
      expect(left["<|>"](fallback)).toBe(99);
    });
  });

  describe("tryCatch captures errors and returns Either", () => {
    test("returns Right when function succeeds", () => {
      const result = Either.tryCatch(
        () => 42,
        (e) => `Error: ${e.message}`
      );
      expect(result.isRight).toBe(true);
      expect(result.getValue()).toBe(42);
    });

    test("returns Left with mapped error message when function throws", () => {
      const result = Either.tryCatch(
        () => {
          throw new Error("Something went wrong");
        },
        (e) => `Error: ${e.message}`
      );
      expect(result.isLeft).toBe(true);
      expect(result.getValue()).toBe("Error: Something went wrong");
    });

    test("handles different error types correctly", () => {
      const result = Either.tryCatch(
        () => {
          throw new TypeError("Invalid type");
        },
        (e) => `Handled: ${e.name}`
      );
      expect(result.isLeft).toBe(true);
      expect(result.getValue()).toBe("Handled: TypeError");
    });

    test("executes function and wraps result in Right", () => {
      let called = false;
      const result = Either.tryCatch(
        () => {
          called = true;
          return "Success";
        },
        () => "Failed"
      );
      expect(called).toBe(true);
      expect(result.isRight).toBe(true);
      expect(result.getValue()).toBe("Success");
    });

    test("calls error handler when function throws", () => {
      let called = false;
      const result = Either.tryCatch(
        () => {
          throw new Error("Boom!");
        },
        () => {
          called = true;
          return "Recovery";
        }
      );
      expect(called).toBe(true);
      expect(result.isLeft).toBe(true);
      expect(result.getValue()).toBe("Recovery");
    });

    test("catches thrown errors and returns Left", () => {
      const throwingFn = () => {
        throw new Error("Unexpected error");
      };

      const result = Either.tryCatch(throwingFn, (e) => `Caught: ${e.message}`);

      // `tryCatch` should catch the error, so it must not throw
      expect(() => result).not.toThrow();

      // `result` should be a Left containing the mapped error message
      expect(result.isLeft).toBe(true);
      expect(result.getValue()).toBe("Caught: Unexpected error");
    });
  });
});

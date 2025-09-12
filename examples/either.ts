import { Either } from "../src/Either";
import type { $Either } from "../src/Either";

export async function eitherExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`Either | ${label}:`, value);
  // Constructors
  const rightValue = Either.right<string, number>(10);
  const leftValue = Either.left<string, number>("err");
  const rightAlias = Either.pack<string, number>(20); // alias of right

  // Guards
  show("isEither", Either.isEither(rightValue));
  show("isLeft", Either.isLeft(leftValue));
  show("isRight", Either.isRight(rightValue));

  // tryCatch
  const safe = Either.tryCatch(
    () => JSON.parse("{\"a\":1}"),
    (e) => new Error(String(e))
  );
  const unsafe = Either.tryCatch(
    () => JSON.parse("oops"),
    (e) => new Error(String(e))
  );
  show("tryCatch Right", safe.match(String, (v) => String((v as any).a)));
  show("tryCatch Left", unsafe.match((e) => (e as Error).message, () => ""));

  // Functor / Applicative / Monad
  const incremented = rightValue["<$>"]((n) => n + 1);
  const doubleFn = Either.right<string, (n: number) => number>((n) => n * 2);
  const appliedRight = doubleFn["<*>"](rightValue);
  const decremented = rightValue[">>="]((n) => Either.right<string, number>(n - 3));
  show("<$> increment", incremented.match(String, String));
  show("<*> doubleFn", appliedRight.match(String, String));
  show(">>= minusThree", decremented.match(String, String));

  // orElse / getOrElse / match + operator aliases
  show("<?> orElse (Right)", rightValue.orElse(Either.right(0)).match(String, String));
  show("<?> orElse (Left)", leftValue["<?>"](Either.right(0)).match(String, String));
  show("<|> getOrElse (Right)", rightValue.getOrElse(0));
  show("<|> getOrElse (Left)", leftValue["<|>"](0));
  show(
    "match",
    rightValue.match(
      (e) => `L:${e}`,
      (v) => `R:${v}`
    )
  );

  const sumWithDo = Either.do(function*($: $Either<string>) {
    const right = Either.right<string, number>;
    const a = yield* $(right(2));
    const b = yield* $(right(a + 3));
    return a + b; // 7
  });
  show("do ($) sum", sumWithDo.match(String, String));
}

// (no auto-run on import; run via examples/index.ts or direct runner)

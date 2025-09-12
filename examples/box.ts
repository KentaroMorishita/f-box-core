import { Box } from "../src/Box";
import type { $Box } from "../src/Box";

export async function boxExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`Box | ${label}:`, value);

  // Construct and inspect
  const boxValue = Box.pack(10);
  show("getValue", boxValue.getValue());
  show("isBox", Box.isBox(boxValue));

  // Functor (use operator alias "<$>")
  const incrementedBox = boxValue["<$>"]((n) => n + 1);
  const doubledBox = boxValue["<$>"]((n) => n * 2);
  show("<$> increment", incrementedBox.getValue());
  show("<$> double", doubledBox.getValue());

  // Applicative (use operator alias "<*>")
  const addThreeFnBox = Box.pack((n: number) => n + 3);
  show("<*> addThree", addThreeFnBox["<*>"](boxValue).getValue());

  // Monad (use operator alias ">>=")
  const tripledBox = boxValue[">>="]((n) => Box.pack(n * 3));
  const decrementedBox = boxValue[">>="]((n) => Box.pack(n - 1));
  show(">>= triple", tripledBox.getValue());
  show(">>= minusOne", decrementedBox.getValue());

  // Do-notation ($ adapter + yield*)
  const sumWithDo = Box.do(function* ($: $Box) {
    const a = yield* $(Box.pack(2));
    const c = yield* $(Box.pack(a * 5));
    return a + c; // 2 + 10 = 12
  });
  show("do ($) sum", sumWithDo.getValue());
}

// (no auto-run on import; run via examples/index.ts or direct runner)

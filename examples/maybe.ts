import { Maybe } from "../src/Maybe";
import type { $Maybe } from "../src/Maybe";
import type { Maybe as MaybeType } from "../src/Maybe";

export async function maybeExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`Maybe | ${label}:`, value);

  // Constructors
  const justValue = Maybe.just(10);
  const nothingValue: MaybeType<number> = Maybe.nothing();

  // Inspect / guards
  show("isMaybe(Just)", Maybe.isMaybe(justValue));
  show("isMaybe(Nothing)", Maybe.isMaybe(nothingValue));
  show("isJust(Just)", Maybe.isJust(justValue));
  show("isNothing(Nothing)", Maybe.isNothing(nothingValue));

  // Functor (use operator alias "<$>")
  const mappedJust = justValue["<$>"]((x) => x + 1).getValue();
  const mappedNothing = nothingValue["<$>"]((x) => x).getValue();
  show("<$> (Just)", mappedJust);
  show("<$> (Nothing)", mappedNothing);

  // Applicative
  const doubleFn = Maybe.just((x: number) => x * 2);
  const appliedJust = doubleFn["<*>"](justValue).getValue();
  const appliedNothingFn = nothingValue["<*>"](justValue).getValue();
  show("<*> (fn Just, val Just)", appliedJust);
  show("<*> (fn Nothing, val Just)", appliedNothingFn);

  // Monad (use operator alias ">>=")
  const increasedJust = justValue[">>="]((x) => Maybe.just(x + 5));
  const increasedNothing = nothingValue[">>="]((x) => Maybe.just(x + 5));
  show(">>= (Just)", increasedJust.getValue());
  show(">>= (Nothing)", increasedNothing.getValue());

  // orElse / getOrElse / match
  show("orElse (Just)", justValue.orElse(Maybe.just(0)).getValue());
  show("orElse (Nothing)", nothingValue.orElse(Maybe.just(0)).getValue());
  show("<|> getOrElse (Just)", justValue.getOrElse(0));
  show("<|> getOrElse (Nothing)", nothingValue.getOrElse(0));
  show(
    "match (Just)",
    justValue.match(
      (v) => `Just:${v}`,
      () => "Nothing"
    )
  );

  const sumWithDo = Maybe.do(function* ($: $Maybe) {
    const a = yield* $(Maybe.just(2));
    const b = yield* $(Maybe.just(a + 3));
    return a + b; // 7
  });
  show("do ($ adapter) sum", sumWithDo.getValue());
}

// (no auto-run on import; run via examples/index.ts or direct runner)

import { RBox, set } from "../src/RBox";
import type { $RBox } from "../src/RBox";

export async function rboxExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`RBox | ${label}:`, value);

  // Construct and inspect
  const state = RBox.pack(0);
  show("getValue", state.getValue());

  // Subscribe / unsubscribe
  const subscriptionKey = state.subscribe((v) => console.log("RBox | subscribe change:", v));

  // set via helper and direct
  set(state)(1);
  state.setValue((prev) => prev + 1); // 2
  show("value after set", state.getValue());

  // Functor (use operator alias "<$>")
  const doubleState = state["<$>"]((n) => n * 2);
  show("<$> double (derived)", doubleState.getValue());

  // Applicative
  const addTenFn = RBox.pack((n: number) => n + 10);
  const appliedState = addTenFn["<*>"](state);
  show("<*> addTen", appliedState.getValue());

  // Monad (use operator alias ">>=")
  const tripledState = state[">>="]((n) => RBox.pack(n * 3));
  show(">>= triple", tripledState.getValue());

  const d2 = RBox.do(function* ($: $RBox) {
    const a = yield* $(RBox.pack(2));
    const c = yield* $(RBox.pack(a + 3));
    return a + c; // 2 + 5 = 7
  });
  show("do ($) sum", d2.getValue());

  // Cleanup
  state.unsubscribe(subscriptionKey);
  state.unsubscribeAll();
  state.detach();
  doubleState.detach();
  appliedState.detach();
  tripledState.detach();
  d2.detach();
}

// (no auto-run on import; run via examples/index.ts or direct runner)

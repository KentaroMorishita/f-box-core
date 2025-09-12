import { Task } from "../src/Task";
import type { $Task } from "../src/Task";

export async function taskExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`Task | ${label}:`, value);

  // Constructors
  const taskValue = Task.pack(10); // lift immediate value
  const fetchTwentyTask = Task.from(async () => 20); // from async function
  show("isTask", Task.isTask(taskValue));
  show("from", await fetchTwentyTask.run());

  // Functor / Applicative / Monad (use operator aliases)
  const mappedPlusOne = await taskValue["<$>"]((n) => n + 1).run();
  const tf = Task.pack((n: number) => n * 2);
  const appliedTimesTwo = await tf["<*>"](taskValue).run();
  const flatMappedMinusThree = await taskValue[">>="]((n) => Task.pack(n - 3)).run();
  show("<$> +1", mappedPlusOne);
  show("<*> *2", appliedTimesTwo);
  show(">>= -3", flatMappedMinusThree);

  // Error-safe variants
  const ok = await Task.tryCatch(
    async () => JSON.parse("{\"a\":1}"),
    () => ({ a: 0 })
  ).run();
  show("tryCatch", ok);

  await expectReject(() =>
    Task.tryTask(async () => JSON.parse("oops")).run()
  );

  const sumWithDo = await Task.do(function* ($: $Task) {
    const a = yield* $(Task.pack(2));
    const b = yield* $(Task.pack(a + 3));
    return a + b; // 7
  }).run();
  show("do ($) sum", sumWithDo);
}

async function expectReject(run: () => Promise<any>) {
  try {
    await run();
    console.log("Task | tryTask: should reject but resolved");
  } catch {
    console.log("Task | tryTask: rejected as expected");
  }
}

// (no auto-run on import; run via examples/index.ts or direct runner)

import { TaskEither } from "../src/TaskEither";
import type { $TaskEither } from "../src/TaskEither";
import { Task } from "../src/Task";
import { Either } from "../src/Either";

export async function taskEitherExamples() {
  const show = (label: string, value: unknown) =>
    console.log(`TaskEither | ${label}:`, value);

  // Constructors and lifts
  const rightTaskEither = TaskEither.right<string, number>(10);
  const leftTaskEither = TaskEither.left<string, number>("err");
  const fromTaskRight = TaskEither.fromTask<string, number>(Task.pack(5));
  const fromEitherTE = TaskEither.fromEither<string, number>(Either.right(7));

  // map / flatMap / apply (use operator aliases)
  const mappedRight = await rightTaskEither["<$>"]((n) => n + 1).run();
  show("<$> +1 (Right)", mappedRight.match(String, String));

  const boundRight = await rightTaskEither
  [">>="]((n) => TaskEither.right<string, number>(n * 2))
    .run();
  show(">>= *2 (Right)", boundRight.match(String, String));

  const appliedPlus3 = await TaskEither.right<string, (n: number) => number>((n) => n + 3)
  ["<*>"](rightTaskEither)
    .run();
  show("<*> +3", appliedPlus3.match(String, String));

  // match (returns Task<U>)
  const matchedRight = await rightTaskEither.match(
    () => 0,
    (x) => x + 1
  ).run();
  const matchedLeft = await leftTaskEither.match(
    () => 123,
    () => 0
  ).run();
  show("match to Task (Right)", matchedRight);
  show("match to Task (Left)", matchedLeft);

  // tryCatch
  const ok = await TaskEither.tryCatch(
    async () => JSON.parse("{\"a\":1}"),
    (e) => String(e)
  ).run();
  const ng = await TaskEither.tryCatch(
    async () => JSON.parse("oops"),
    (e) => String(e)
  ).run();
  show("tryCatch Right", ok.match(String, (v: any) => v.a));
  show("tryCatch Left", ng.match(String, String));

  // fromTask / fromEither
  show("fromTask", (await fromTaskRight.run()).match(String, String));
  show("fromEither", (await fromEitherTE.run()).match(String, String));

  const sumWithDo = await TaskEither.do(function*($: $TaskEither<string>) {
    const right = TaskEither.right<string, number>;
    const a = yield* $(right(2));
    const b = yield* $(right(a + 3));
    return a + b; // 7
  }).run();
  show("do ($) sum", sumWithDo.match(String, String));
}

// (no auto-run on import; run via examples/index.ts or direct runner)

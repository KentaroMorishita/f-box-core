// Aggregate runner for examples. Run with ts-node or compile.
import { boxExamples } from "./box";
import { rboxExamples } from "./rbox";
import { maybeExamples } from "./maybe";
import { eitherExamples } from "./either";
import { taskExamples } from "./task";
import { taskEitherExamples } from "./task-either";

async function main() {
  console.log("--- Box ---");
  await boxExamples();
  console.log("\n--- RBox ---");
  await rboxExamples();
  console.log("\n--- Maybe ---");
  await maybeExamples();
  console.log("\n--- Either ---");
  await eitherExamples();
  console.log("\n--- Task ---");
  await taskExamples();
  console.log("\n--- TaskEither ---");
  await taskEitherExamples();
}

main();


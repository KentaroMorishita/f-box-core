// main.test.ts
import * as Main from "../src/main";

describe("Main exports", () => {
  test("should export Box utilities", () => {
    expect(Main.Box).toBeDefined();
  });

  test("should export RBox utilities", () => {
    expect(Main.RBox).toBeDefined();
  });

  test("should export Maybe utilities", () => {
    expect(Main.Maybe).toBeDefined();
  });

  test("should export Either utilities", () => {
    expect(Main.Either).toBeDefined();
  });

  test("should export Task utilities", () => {
    expect(Main.Task).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { makeConnectionKey, normalizeConnectionOptions, parseArgs } from "../src/utils.js";

describe("connection utils", () => {
  it("parses shell style args and applies defaults", () => {
    const normalized = normalizeConnectionOptions({
      args: '--flag "quoted value"',
      projectPath: "D:/demo",
      trustProject: true
    });

    expect(parseArgs('--flag "quoted value"')).toEqual(["--flag", "quoted value"]);
    expect(normalized.mode).toBe("auto");
    expect(normalized.timeout).toBe(30_000);
    expect(normalized.args).toEqual(["--flag", "quoted value"]);
    expect(normalized.trustProject).toBe(true);
  });

  it("creates stable connection keys", () => {
    const left = makeConnectionKey(normalizeConnectionOptions({ projectPath: "D:/demo", mode: "launch" }));
    const right = makeConnectionKey(normalizeConnectionOptions({ projectPath: "D:/demo", mode: "launch" }));

    expect(left).toBe(right);
  });
});

import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/session/sessionManager.js";
import { FakeAdapterFactory } from "./helpers/fakeAdapter.js";

describe("SessionManager", () => {
  it("reuses a matching session", async () => {
    const factory = new FakeAdapterFactory();
    const manager = new SessionManager(factory);

    const first = await manager.ensureConnection({ projectPath: "D:/demo", mode: "launch" });
    const second = await manager.ensureConnection({ projectPath: "D:/demo", mode: "launch" });

    expect(first.key).toBe(second.key);
    expect(factory.createCount).toBe(1);
  });

  it("requires disambiguation when multiple sessions exist", async () => {
    const factory = new FakeAdapterFactory();
    const manager = new SessionManager(factory);

    await manager.ensureConnection({ projectPath: "D:/demo-a", mode: "launch" });
    await manager.ensureConnection({ projectPath: "D:/demo-b", mode: "launch" });

    await expect(manager.ensureConnection()).rejects.toThrow("Multiple sessions are active");
  });
});

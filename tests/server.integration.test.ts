import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createWeappMcpServer } from "../src/mcp/server.js";
import { WeappToolController } from "../src/mcp/controller.js";
import { SessionManager } from "../src/session/sessionManager.js";
import { FakeAdapterFactory } from "./helpers/fakeAdapter.js";

async function createHarness() {
  const factory = new FakeAdapterFactory();
  const manager = new SessionManager(factory);
  const controller = new WeappToolController(manager);
  const server = createWeappMcpServer(controller);
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    server,
    manager,
    factory
  };
}

describe("MCP server integration", () => {
  it("registers the full tool surface", async () => {
    const { client, server, manager } = await createHarness();
    const tools = await client.listTools();

    expect(tools.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "mp_ensureConnection",
        "mp_navigate",
        "page_getElement",
        "element_getBoundingClientRect",
        "element_tap"
      ])
    );

    await manager.closeAll();
    await server.close();
  });

  it("executes tools through the controller and returns structured results", async () => {
    const { client, server, manager } = await createHarness();
    const ensureResult = await client.callTool({
      name: "mp_ensureConnection",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        }
      }
    });

    expect(ensureResult.structuredContent).toMatchObject({
      mode: "launch",
      sdkVersion: "3.9.0"
    });

    const elementResult = await client.callTool({
      name: "page_getElement",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        },
        selector: ".card",
        withWxml: true
      }
    });

    expect(elementResult.structuredContent).toMatchObject({
      tagName: "view",
      outerWxml: '<view selector=".card"></view>'
    });

    const screenshotResult = await client.callTool({
      name: "mp_screenshot",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        }
      }
    });

    expect(screenshotResult.content[0]).toMatchObject({
      type: "image",
      mimeType: "image/png"
    });

    await manager.closeAll();
    await server.close();
  });

  it("returns tool errors without crashing the server", async () => {
    const { client, server, manager } = await createHarness();
    const result = await client.callTool({
      name: "element_input",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        },
        selector: ".bad-target",
        value: "hello"
      }
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      error: {
        message: "element_input only supports input and textarea elements"
      }
    });

    const logs = await client.callTool({
      name: "mp_getLogs",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        },
        clear: true
      }
    });

    expect(logs.structuredContent).toMatchObject({
      value: [
        {
          message: "ready"
        }
      ]
    });

    const logsAfterClear = await client.callTool({
      name: "mp_getLogs",
      arguments: {
        connection: {
          projectPath: "D:/demo",
          mode: "launch"
        }
      }
    });

    expect(logsAfterClear.structuredContent).toMatchObject({
      value: []
    });

    await manager.closeAll();
    await server.close();
  });
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { asError, WeappMcpError } from "../errors.js";
import type { ConnectionOptions } from "../types.js";
import { createTextResult } from "../utils.js";
import type { WeappToolController } from "./controller.js";

const connectionSchema = z
  .object({
    account: z.string().optional(),
    args: z.union([z.string(), z.array(z.string())]).optional(),
    autoClose: z.boolean().optional(),
    cliPath: z.string().optional(),
    cwd: z.string().optional(),
    mode: z.enum(["auto", "connect", "launch"]).optional(),
    port: z.number().int().positive().optional(),
    projectPath: z.string().optional(),
    ticket: z.string().optional(),
    timeout: z.number().int().positive().optional(),
    trustProject: z.boolean().optional(),
    wsEndpoint: z.string().optional()
  })
  .partial();

type ContentPart = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

type ToolResult = {
  content: ContentPart[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function normalizeStructuredContent(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {
    value: payload
  };
}

function ok(payload: unknown, content?: ContentPart[]): ToolResult {
  return {
    content: content ?? [createTextResult(payload)],
    structuredContent: normalizeStructuredContent(payload)
  };
}

function fail(error: unknown): ToolResult {
  const normalized = asError(error);
  const code = error instanceof WeappMcpError ? error.code : "INTERNAL_ERROR";
  const payload = {
    error: {
      code,
      message: normalized.message,
      details: error instanceof WeappMcpError ? error.details : undefined
    }
  };

  return {
    isError: true,
    content: [createTextResult(payload)],
    structuredContent: payload
  };
}

async function invoke<T>(operation: () => Promise<T>) {
  try {
    return ok(await operation());
  } catch (error) {
    return fail(error);
  }
}

export function createWeappMcpServer(controller: WeappToolController): McpServer {
  const server = new McpServer(
    {
      name: "weapp-dev",
      version: "0.1.0"
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  server.registerTool("mp_ensureConnection", {
    description: "Create, reuse, or reconnect a WeChat DevTools automation session.",
    inputSchema: {
      connection: connectionSchema.optional(),
      reconnect: z.boolean().optional()
    }
  }, async ({ connection, reconnect }) => invoke(() => controller.ensureConnection(connection as ConnectionOptions | undefined, reconnect)));

  server.registerTool("mp_navigate", {
    description: "Navigate within the current mini program.",
    inputSchema: {
      connection: connectionSchema.optional(),
      path: z.string().optional(),
      query: z.record(z.string(), z.unknown()).optional(),
      transition: z.enum(["navigateTo", "redirectTo", "reLaunch", "switchTab", "navigateBack"]).optional(),
      waitMs: z.number().int().nonnegative().optional()
    }
  }, async ({ connection, path, query, transition, waitMs }) => invoke(() => controller.navigate({ connection, path, query, transition, waitMs })));

  server.registerTool("mp_currentPage", {
    description: "Get information about the current page.",
    inputSchema: {
      connection: connectionSchema.optional(),
      withData: z.boolean().optional()
    }
  }, async ({ connection, withData }) => invoke(() => controller.currentPage(connection as ConnectionOptions | undefined, withData)));

  server.registerTool("mp_getLogs", {
    description: "Read buffered console and exception logs from the current session.",
    inputSchema: {
      connection: connectionSchema.optional(),
      clear: z.boolean().optional()
    }
  }, async ({ connection, clear }) => invoke(() => controller.getLogs(connection as ConnectionOptions | undefined, clear)));

  server.registerTool("mp_screenshot", {
    description: "Capture a screenshot from the current mini program viewport.",
    inputSchema: {
      connection: connectionSchema.optional(),
      path: z.string().optional()
    }
  }, async ({ connection, path }) => {
    try {
      const result = await controller.screenshot(connection as ConnectionOptions | undefined, path);
      if (result.data) {
        return ok(result, [
          { type: "image", data: result.data, mimeType: "image/png" },
          createTextResult(result)
        ]);
      }

      return ok(result);
    } catch (error) {
      return fail(error);
    }
  });

  server.registerTool("mp_callWx", {
    description: "Call a wx API method in the mini program runtime.",
    inputSchema: {
      connection: connectionSchema.optional(),
      method: z.string(),
      args: z.array(z.unknown()).optional()
    }
  }, async ({ connection, method, args }) => invoke(() => controller.callWx(connection as ConnectionOptions | undefined, method, args)));

  server.registerTool("page_callMethod", {
    description: "Call an exposed method on the current page instance.",
    inputSchema: {
      connection: connectionSchema.optional(),
      method: z.string(),
      args: z.array(z.unknown()).optional()
    }
  }, async ({ connection, method, args }) => invoke(() => controller.pageCallMethod(connection as ConnectionOptions | undefined, method, args)));

  server.registerTool("page_getData", {
    description: "Get the current page data object or a specific path.",
    inputSchema: {
      connection: connectionSchema.optional(),
      path: z.string().optional()
    }
  }, async ({ connection, path }) => invoke(() => controller.pageGetData(connection as ConnectionOptions | undefined, path)));

  server.registerTool("page_setData", {
    description: "Update the current page data object via setData.",
    inputSchema: {
      connection: connectionSchema.optional(),
      data: z.record(z.string(), z.unknown())
    }
  }, async ({ connection, data }) => invoke(() => controller.pageSetData(connection as ConnectionOptions | undefined, data)));

  server.registerTool("page_getElement", {
    description: "Get a single element summary from the current page.",
    inputSchema: {
      connection: connectionSchema.optional(),
      selector: z.string(),
      innerSelector: z.string().optional(),
      withWxml: z.boolean().optional()
    }
  }, async ({ connection, selector, innerSelector, withWxml }) => invoke(() => controller.pageGetElement(connection as ConnectionOptions | undefined, selector, withWxml, innerSelector)));

  server.registerTool("page_getElements", {
    description: "Get multiple element summaries from the current page.",
    inputSchema: {
      connection: connectionSchema.optional(),
      selector: z.string(),
      withWxml: z.boolean().optional()
    }
  }, async ({ connection, selector, withWxml }) => invoke(() => controller.pageGetElements(connection as ConnectionOptions | undefined, selector, withWxml)));

  server.registerTool("page_waitElement", {
    description: "Wait for an element to appear on the current page.",
    inputSchema: {
      connection: connectionSchema.optional(),
      selector: z.string(),
      timeoutMs: z.number().int().positive().optional()
    }
  }, async ({ connection, selector, timeoutMs }) => invoke(() => controller.pageWaitElement(connection as ConnectionOptions | undefined, selector, timeoutMs)));

  server.registerTool("page_waitTimeout", {
    description: "Wait for a fixed amount of time.",
    inputSchema: {
      connection: connectionSchema.optional(),
      milliseconds: z.number().int().nonnegative()
    }
  }, async ({ connection, milliseconds }) => invoke(() => controller.pageWaitTimeout(connection as ConnectionOptions | undefined, milliseconds)));

  const selectorInput = {
    connection: connectionSchema.optional(),
    selector: z.string(),
    innerSelector: z.string().optional()
  };

  server.registerTool("element_callMethod", {
    description: "Call a method on a custom component instance.",
    inputSchema: {
      ...selectorInput,
      method: z.string(),
      args: z.array(z.unknown()).optional()
    }
  }, async ({ connection, selector, method, args, innerSelector }) => invoke(() => controller.elementCallMethod(connection as ConnectionOptions | undefined, selector, method, args, innerSelector)));

  server.registerTool("element_getAttributes", {
    description: "Get one or more attributes from an element.",
    inputSchema: {
      ...selectorInput,
      names: z.array(z.string()).min(1)
    }
  }, async ({ connection, selector, names, innerSelector }) => invoke(() => controller.elementGetAttributes(connection as ConnectionOptions | undefined, selector, names, innerSelector)));

  server.registerTool("element_getBoundingClientRect", {
    description: "Get the rendered bounding rectangle for an element.",
    inputSchema: selectorInput
  }, async ({ connection, selector, innerSelector }) => invoke(() => controller.elementGetBoundingClientRect(connection as ConnectionOptions | undefined, selector, innerSelector)));

  server.registerTool("element_getData", {
    description: "Get component instance data.",
    inputSchema: {
      ...selectorInput,
      path: z.string().optional()
    }
  }, async ({ connection, selector, path, innerSelector }) => invoke(() => controller.elementGetData(connection as ConnectionOptions | undefined, selector, path, innerSelector)));

  server.registerTool("element_getInnerElement", {
    description: "Get a single descendant element summary inside a root element.",
    inputSchema: {
      ...selectorInput,
      targetSelector: z.string(),
      withWxml: z.boolean().optional()
    }
  }, async ({ connection, selector, targetSelector, withWxml, innerSelector }) => invoke(() => controller.elementGetInnerElement(connection as ConnectionOptions | undefined, selector, targetSelector, withWxml, innerSelector)));

  server.registerTool("element_getInnerElements", {
    description: "Get multiple descendant element summaries inside a root element.",
    inputSchema: {
      ...selectorInput,
      targetSelector: z.string(),
      withWxml: z.boolean().optional()
    }
  }, async ({ connection, selector, targetSelector, withWxml, innerSelector }) => invoke(() => controller.elementGetInnerElements(connection as ConnectionOptions | undefined, selector, targetSelector, withWxml, innerSelector)));

  server.registerTool("element_getStyles", {
    description: "Get one or more computed style properties from an element.",
    inputSchema: {
      ...selectorInput,
      names: z.array(z.string()).min(1)
    }
  }, async ({ connection, selector, names, innerSelector }) => invoke(() => controller.elementGetStyles(connection as ConnectionOptions | undefined, selector, names, innerSelector)));

  server.registerTool("element_getWxml", {
    description: "Get the WXML for an element.",
    inputSchema: {
      ...selectorInput,
      outer: z.boolean().optional()
    }
  }, async ({ connection, selector, outer, innerSelector }) => invoke(() => controller.elementGetWxml(connection as ConnectionOptions | undefined, selector, outer, innerSelector)));

  server.registerTool("element_input", {
    description: "Type text into an input or textarea element.",
    inputSchema: {
      ...selectorInput,
      value: z.string()
    }
  }, async ({ connection, selector, value, innerSelector }) => invoke(() => controller.elementInput(connection as ConnectionOptions | undefined, selector, value, innerSelector)));

  server.registerTool("element_scrollTo", {
    description: "Scroll a scroll-view element to a position.",
    inputSchema: {
      ...selectorInput,
      x: z.number(),
      y: z.number()
    }
  }, async ({ connection, selector, x, y, innerSelector }) => invoke(() => controller.elementScrollTo(connection as ConnectionOptions | undefined, selector, x, y, innerSelector)));

  server.registerTool("element_setData", {
    description: "Update a custom component instance via setData.",
    inputSchema: {
      ...selectorInput,
      data: z.record(z.string(), z.unknown())
    }
  }, async ({ connection, selector, data, innerSelector }) => invoke(() => controller.elementSetData(connection as ConnectionOptions | undefined, selector, data, innerSelector)));

  server.registerTool("element_tap", {
    description: "Tap an element.",
    inputSchema: {
      ...selectorInput,
      waitMs: z.number().int().nonnegative().optional()
    }
  }, async ({ connection, selector, waitMs, innerSelector }) => invoke(() => controller.elementTap(connection as ConnectionOptions | undefined, selector, waitMs, innerSelector)));

  return server;
}

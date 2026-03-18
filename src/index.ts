import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MiniprogramAutomatorFactory } from "./adapter/automatorFactory.js";
import { WeappToolController } from "./mcp/controller.js";
import { createWeappMcpServer } from "./mcp/server.js";
import { SessionManager } from "./session/sessionManager.js";

export function createApplication() {
  const sessionManager = new SessionManager(new MiniprogramAutomatorFactory());
  const controller = new WeappToolController(sessionManager);
  const server = createWeappMcpServer(controller);

  return {
    server,
    controller,
    sessionManager
  };
}

export async function startStdioServer() {
  const app = createApplication();
  const transport = new StdioServerTransport();
  await app.server.connect(transport);
  return app;
}

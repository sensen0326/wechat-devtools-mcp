#!/usr/bin/env node
import { asError } from "./errors.js";
import { startStdioServer } from "./index.js";

async function main() {
  const app = await startStdioServer();
  const shutdown = async () => {
    await app.sessionManager.closeAll();
    await app.server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((error) => {
  const normalized = asError(error);
  process.stderr.write(`wechat-devtools-mcp failed to start: ${normalized.message}\n`);
  process.exit(1);
});

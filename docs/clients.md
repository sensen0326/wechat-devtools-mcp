# Client Configuration Examples

## Codex desktop

```json
{
  "mcpServers": {
    "weapp-dev": {
      "command": "npx",
      "args": ["wechat-devtools-mcp"]
    }
  }
}
```

## Claude Desktop

```json
{
  "mcpServers": {
    "weapp-dev": {
      "command": "npx",
      "args": ["wechat-devtools-mcp"]
    }
  }
}
```

## Generic MCP client

Start the server over stdio:

```bash
npx wechat-devtools-mcp
```

Then register the process as a stdio MCP server named `weapp-dev`.

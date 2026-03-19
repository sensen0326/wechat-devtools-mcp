# Client Configuration Examples

## Codex desktop

```json
{
  "mcpServers": {
    "weapp-dev": {
      "command": "npx",
      "args": ["-y", "@sensen0326/wechat-devtools-mcp@latest"]
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
      "args": ["-y", "@sensen0326/wechat-devtools-mcp@latest"]
    }
  }
}
```

## Generic MCP client

Start the server over stdio:

```bash
npx -y @sensen0326/wechat-devtools-mcp@latest
```

Then register the process as a stdio MCP server named `weapp-dev`.

## Session-oriented usage

For long-running automation flows, create a named session first:

```json
{
  "name": "mp_ensureConnection",
  "arguments": {
    "connection": {
      "mode": "launch",
      "projectPath": "D:/code/wechat-devtools-mcp/demo/miniprogram",
      "sessionId": "demo-session"
    }
  }
}
```

Subsequent tool calls can send only:

```json
{
  "connection": {
    "sessionId": "demo-session"
  }
}
```

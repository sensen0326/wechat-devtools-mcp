# wechat-devtools-mcp

Reusable MCP server for WeChat DevTools mini program automation and testing.

`wechat-devtools-mcp` wraps `miniprogram-automator` behind a stable MCP tool surface so Codex and other MCP clients can drive WeChat DevTools directly over stdio. The npm package is published as `@sensen0326/wechat-devtools-mcp`.

Chinese documentation: [README.zh-CN.md](./README.zh-CN.md).

## Features

- Full `weapp_dev`-compatible tool surface for connection, page, and element automation.
- Session reuse within a single MCP server process.
- Explicit `sessionId` support, session listing, targeted close, and idle cleanup.
- `launch` and `connect` workflows.
- Windows-first support with macOS path hooks left open for follow-up.
- Mock-tested MCP integration plus a local demo mini program.

## Installation

```bash
npm install -g @sensen0326/wechat-devtools-mcp@latest
```

Or run it on demand:

```bash
npx -y @sensen0326/wechat-devtools-mcp@latest
```

## Tool Surface

- `mp_ensureConnection`
- `mp_listSessions`
- `mp_closeSession`
- `mp_navigate`
- `mp_currentPage`
- `mp_getLogs`
- `mp_screenshot`
- `mp_callWx`
- `page_callMethod`
- `page_getData`
- `page_setData`
- `page_getElement`
- `page_getElements`
- `page_waitElement`
- `page_waitTimeout`
- `element_callMethod`
- `element_getAttributes`
- `element_getBoundingClientRect`
- `element_getData`
- `element_getInnerElement`
- `element_getInnerElements`
- `element_getStyles`
- `element_getWxml`
- `element_input`
- `element_scrollTo`
- `element_setData`
- `element_tap`

## Connection Model

All tools accept an optional `connection` object with these fields:

- `account`
- `args`
- `autoClose`
- `cliPath`
- `cwd`
- `mode`
- `port`
- `projectPath`
- `sessionId`
- `ticket`
- `timeout`
- `trustProject`
- `wsEndpoint`

`connection.mode` supports:

- `auto`: reuse a cached session when possible; otherwise prefer `wsEndpoint`, then `projectPath`.
- `connect`: connect to an already-open WeChat DevTools instance with automation enabled.
- `launch`: open WeChat DevTools through the CLI for a given project.

When `sessionId` is present, the server reuses that session directly. Idle sessions are reclaimed after 15 minutes by default. Set `WEAPP_MCP_SESSION_IDLE_TIMEOUT_MS=0` to disable idle cleanup.

## Example

Create a named session:

```json
{
  "name": "mp_ensureConnection",
  "arguments": {
    "connection": {
      "mode": "launch",
      "projectPath": "D:/code/wechat-devtools-mcp/demo/miniprogram",
      "sessionId": "demo-session",
      "trustProject": true
    }
  }
}
```

Reuse that session:

```json
{
  "name": "page_getElement",
  "arguments": {
    "connection": {
      "sessionId": "demo-session"
    },
    "selector": ".button",
    "withWxml": true
  }
}
```

List sessions:

```json
{
  "name": "mp_listSessions",
  "arguments": {}
}
```

## Client Setup

See [docs/clients.md](./docs/clients.md) for Codex, Claude Desktop, and generic stdio examples.

## Local Development

```bash
npm install
npm run check
npm test
npm run build
```

To smoke test against the bundled demo project, open [demo/miniprogram](./demo/miniprogram) in WeChat DevTools and use `projectPath` with `mp_ensureConnection`.

You can also run the local smoke script:

```bash
npm run smoke:demo -- --inputValue hello --inspectSelector .button --screenshotPath .tmp/smoke.png
```

Or connect to an existing DevTools instance:

```bash
npm run smoke -- --wsEndpoint ws://127.0.0.1:9420 --inspectSelector .button
```

## Testing

- CI runs TypeScript checks, Vitest, and build verification on Windows.
- Real WeChat DevTools smoke tests are intentionally local/manual.

## License

MIT

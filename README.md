# wechat-devtools-mcp

Reusable MCP server for WeChat DevTools mini program automation and testing.

`wechat-devtools-mcp` wraps `miniprogram-automator` behind a stable MCP tool surface so Codex and other MCP clients can drive WeChat DevTools directly over stdio.

中文说明见 [README.zh-CN.md](./README.zh-CN.md).

## Features

- Full `weapp_dev`-compatible tool surface for connection, page, and element automation.
- Session reuse within a single MCP server process.
- `launch` and `connect` workflows.
- Windows-first support with macOS path hooks left open for follow-up.
- Mock-tested MCP integration plus a local demo mini program.

## Installation

```bash
npm install -g wechat-devtools-mcp
```

Or run it on demand:

```bash
npx wechat-devtools-mcp
```

## Tool Surface

- `mp_ensureConnection`
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
- `ticket`
- `timeout`
- `trustProject`
- `wsEndpoint`

`connection.mode` supports:

- `auto`: reuse a cached session when possible; otherwise prefer `wsEndpoint`, then `projectPath`.
- `connect`: connect to an already-open WeChat DevTools instance with automation enabled.
- `launch`: open WeChat DevTools through the CLI for a given project.

## Example

Example MCP call:

```json
{
  "name": "mp_ensureConnection",
  "arguments": {
    "connection": {
      "mode": "launch",
      "projectPath": "D:/code/wechat-devtools-mcp/demo/miniprogram",
      "trustProject": true
    }
  }
}
```

Example follow-up call:

```json
{
  "name": "page_getElement",
  "arguments": {
    "connection": {
      "mode": "launch",
      "projectPath": "D:/code/wechat-devtools-mcp/demo/miniprogram"
    },
    "selector": ".button",
    "withWxml": true
  }
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

## Testing

- CI runs TypeScript checks, Vitest, and build verification on Windows.
- Real WeChat DevTools smoke tests are intentionally local/manual.

## License

MIT

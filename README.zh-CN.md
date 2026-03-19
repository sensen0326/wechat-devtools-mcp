# wechat-devtools-mcp

一个可复用、可开源的微信开发者工具 MCP Server，用于连接微信开发者工具并执行小程序自动化调试与测试。

`wechat-devtools-mcp` 用 `miniprogram-automator` 作为底层能力，把它包装成稳定的 MCP 工具面，便于 Codex 和其他 MCP 客户端直接调用。npm 包名为 `@sensen0326/wechat-devtools-mcp`。

## 特性

- 完整兼容 `weapp_dev` 风格的工具面。
- 单个 MCP 进程内自动复用会话。
- 支持显式 `sessionId`、会话列表、定向关闭和空闲回收。
- 同时支持 `launch` 和 `connect` 两种接入方式。
- 首版以 Windows 为官方支持平台。
- 自带 mock 集成测试、CI 和 demo 小程序。

## 安装

```bash
npm install -g @sensen0326/wechat-devtools-mcp@latest
```

或直接运行：

```bash
npx -y @sensen0326/wechat-devtools-mcp@latest
```

## 工具列表

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

## 连接参数

所有工具都可以接收一个可选的 `connection` 对象，字段如下：

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

`mode` 说明：

- `auto`：优先复用缓存会话；没有缓存时优先用 `wsEndpoint`，其次用 `projectPath`。
- `connect`：连接已打开且开启自动化的微信开发者工具实例。
- `launch`：通过 CLI 打开指定小程序工程。

当传入 `sessionId` 时，后续工具会直接复用该会话。服务默认会在 15 分钟后回收空闲会话；如果要关闭这一行为，可设置 `WEAPP_MCP_SESSION_IDLE_TIMEOUT_MS=0`。

## 示例

创建一个命名会话：

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

后续复用该会话：

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

列出当前会话：

```json
{
  "name": "mp_listSessions",
  "arguments": {}
}
```

## 客户端接入

Codex、Claude Desktop 和通用 MCP 客户端的示例配置见 [docs/clients.md](./docs/clients.md)。

## 本地开发

```bash
npm install
npm run check
npm test
npm run build
```

如果要做真实烟测，先在微信开发者工具中打开 [demo/miniprogram](./demo/miniprogram)，再用 `projectPath` 调用 `mp_ensureConnection`。

也可以直接跑本地 smoke 脚本：

```bash
npm run smoke:demo -- --inputValue hello --inspectSelector .button --screenshotPath .tmp/smoke.png
```

如果已经有开启自动化的 DevTools 实例：

```bash
npm run smoke -- --wsEndpoint ws://127.0.0.1:9420 --inspectSelector .button
```

## 许可

MIT

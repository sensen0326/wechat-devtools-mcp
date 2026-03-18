import { createRequire } from "node:module";
import type { AdapterFactory, AdapterSession, ElementLike, MiniProgramLike, PageLike } from "./contracts.js";
import type { ConnectionOptions, ElementSummary, LogEntry, PageSummary } from "../types.js";
import { WeappMcpError } from "../errors.js";
import { appendQuery, ensure, normalizeOffset, normalizeQuery, sleep, toBoundingRect, toNumber } from "../utils.js";

const require = createRequire(import.meta.url);

type AutomatorModule = {
  connect(options: { wsEndpoint: string }): Promise<MiniProgramLike>;
  launch(options: {
    cliPath?: string;
    timeout?: number;
    port?: number;
    account?: string;
    ticket?: string;
    projectPath: string;
    trustProject?: boolean;
    args?: string[];
    cwd?: string;
  }): Promise<MiniProgramLike>;
};

function getAutomator(): AutomatorModule {
  return require("miniprogram-automator") as AutomatorModule;
}

async function getSdkVersion(miniProgram: MiniProgramLike): Promise<string | null> {
  const send = (miniProgram as MiniProgramLike & {
    send?: (method: string, params?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  }).send;

  if (!send) {
    return process.env.WECHAT_DEVTOOLS_SDK_VERSION ?? null;
  }

  try {
    const result = await send("Tool.getInfo");
    return typeof result.SDKVersion === "string" ? result.SDKVersion : process.env.WECHAT_DEVTOOLS_SDK_VERSION ?? null;
  } catch {
    return process.env.WECHAT_DEVTOOLS_SDK_VERSION ?? null;
  }
}

function parseLog(level: "info" | "error", payload: unknown): LogEntry {
  const message =
    typeof payload === "string"
      ? payload
      : typeof payload === "object" && payload && "message" in payload
        ? String((payload as Record<string, unknown>).message)
        : JSON.stringify(payload);

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    raw: payload
  };
}

function isCustomElement(element: unknown): element is {
  data(path?: string): Promise<unknown>;
  setData(data: Record<string, unknown>): Promise<void>;
  callMethod(method: string, ...args: unknown[]): Promise<unknown>;
} {
  return typeof element === "object" && element !== null && "data" in element && "setData" in element && "callMethod" in element;
}

function isInputElement(element: unknown): element is { input(value: string): Promise<void> } {
  return typeof element === "object" && element !== null && "input" in element;
}

function isScrollViewElement(element: unknown): element is { scrollTo(x: number, y: number): Promise<void> } {
  return typeof element === "object" && element !== null && "scrollTo" in element;
}

async function safeCall<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback;
  }
}

async function pageSummary(page: PageLike, withData = false): Promise<PageSummary> {
  const size = await page.size();
  const scrollTopValue = await page.scrollTop();
  const scrollTop = Array.isArray(scrollTopValue) ? toNumber(scrollTopValue[0]) : toNumber(scrollTopValue);

  return {
    path: page.path,
    query: normalizeQuery(page.query),
    width: toNumber(size.width),
    height: toNumber(size.height),
    scrollTop,
    data: withData ? await page.data() : undefined
  };
}

async function elementSummary(element: ElementLike, withWxml = false): Promise<ElementSummary> {
  const [text, value, size, offset] = await Promise.all([
    safeCall(() => element.text(), null),
    safeCall(() => element.value(), null),
    safeCall(() => element.size(), { width: "", height: "" }),
    safeCall(() => element.offset(), {})
  ]);

  return {
    tagName: element.tagName,
    text,
    value,
    size: {
      width: toNumber(size.width),
      height: toNumber(size.height)
    },
    offset: normalizeOffset(offset),
    outerWxml: withWxml ? await safeCall(() => element.outerWxml(), "") : undefined
  };
}

export class WechatDevtoolsAdapterSession implements AdapterSession {
  private readonly logs: LogEntry[] = [];

  constructor(
    public readonly connection: ConnectionOptions | undefined,
    public readonly mode: "auto" | "connect" | "launch",
    public readonly sdkVersion: string | null,
    private readonly miniProgram: MiniProgramLike,
    private readonly autoClose: boolean
  ) {
    this.miniProgram.on("console", (...args) => {
      this.pushLog(parseLog("info", args.length === 1 ? args[0] : args));
    });
    this.miniProgram.on("exception", (...args) => {
      this.pushLog(parseLog("error", args.length === 1 ? args[0] : args));
    });
  }

  async currentPage(): Promise<PageSummary | null> {
    const page = await this.miniProgram.currentPage();
    return page ? pageSummary(page) : null;
  }

  async getLogs(clear = false): Promise<LogEntry[]> {
    const snapshot = [...this.logs];
    if (clear) {
      this.logs.length = 0;
    }
    return snapshot;
  }

  async navigate(params: { path?: string; query?: Record<string, unknown>; transition?: string; waitMs?: number }): Promise<PageSummary | null> {
    const transition = params.transition ?? "navigateTo";
    const url = params.path ? appendQuery(params.path, params.query) : undefined;
    let page: PageLike | undefined;

    switch (transition) {
      case "navigateTo":
        page = await this.miniProgram.navigateTo(ensure(url, "path is required for navigateTo", "INVALID_ARGUMENT"));
        break;
      case "redirectTo":
        page = await this.miniProgram.redirectTo(ensure(url, "path is required for redirectTo", "INVALID_ARGUMENT"));
        break;
      case "reLaunch":
        page = await this.miniProgram.reLaunch(ensure(url, "path is required for reLaunch", "INVALID_ARGUMENT"));
        break;
      case "switchTab":
        page = await this.miniProgram.switchTab(ensure(url, "path is required for switchTab", "INVALID_ARGUMENT"));
        break;
      case "navigateBack":
        page = await this.miniProgram.navigateBack();
        break;
      default:
        throw new WeappMcpError("INVALID_ARGUMENT", `Unsupported transition '${transition}'`);
    }

    if (params.waitMs) {
      await sleep(params.waitMs);
    }

    return page ? pageSummary(page) : null;
  }

  async screenshot(path?: string): Promise<{ path?: string; data?: string }> {
    if (path) {
      await this.miniProgram.screenshot({ path });
      return { path };
    }

    const data = await this.miniProgram.screenshot();
    return { data: typeof data === "string" ? data : undefined };
  }

  async callWx(method: string, args: unknown[] = []): Promise<unknown> {
    return this.miniProgram.callWxMethod(method, ...args);
  }

  async pageCallMethod(method: string, args: unknown[] = []): Promise<unknown> {
    const page = await this.requireCurrentPage();
    return page.callMethod(method, ...args);
  }

  async pageGetData(path?: string): Promise<unknown> {
    const page = await this.requireCurrentPage();
    return page.data(path);
  }

  async pageSetData(data: Record<string, unknown>): Promise<void> {
    const page = await this.requireCurrentPage();
    await page.setData(data);
  }

  async pageGetElement(selector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary | null> {
    const element = await this.resolveFromPage(selector, innerSelector);
    return element ? elementSummary(element, withWxml) : null;
  }

  async pageGetElements(selector: string, withWxml = false): Promise<ElementSummary[]> {
    const page = await this.requireCurrentPage();
    const elements = await page.$$(selector);
    return Promise.all(elements.map((element) => elementSummary(element, withWxml)));
  }

  async pageWaitElement(selector: string, timeoutMs = 10_000): Promise<ElementSummary> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const element = await this.pageGetElement(selector);
      if (element) {
        return element;
      }
      await sleep(100);
    }

    throw new WeappMcpError("NOT_FOUND", `Element '${selector}' did not appear within ${timeoutMs}ms`);
  }

  async pageWaitTimeout(milliseconds: number): Promise<void> {
    await sleep(milliseconds);
  }

  async elementCallMethod(selector: string, method: string, args: unknown[] = [], innerSelector?: string): Promise<unknown> {
    const element = await this.requireElement(selector, innerSelector);
    if (!isCustomElement(element)) {
      throw new WeappMcpError("INVALID_ELEMENT_TYPE", "element_callMethod only supports custom components");
    }

    return element.callMethod(method, ...args);
  }

  async elementGetAttributes(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>> {
    const element = await this.requireElement(selector, innerSelector);
    const entries = await Promise.all(names.map(async (name) => [name, await safeCall(() => element.attribute(name), null)] as const));
    return Object.fromEntries(entries);
  }

  async elementGetBoundingClientRect(selector: string, innerSelector?: string) {
    const element = await this.requireElement(selector, innerSelector);
    return toBoundingRect(await elementSummary(element));
  }

  async elementGetData(selector: string, path?: string, innerSelector?: string): Promise<unknown> {
    const element = await this.requireElement(selector, innerSelector);
    if (!isCustomElement(element)) {
      throw new WeappMcpError("INVALID_ELEMENT_TYPE", "element_getData only supports custom components");
    }

    return element.data(path);
  }

  async elementGetInnerElement(selector: string, targetSelector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary | null> {
    const root = await this.requireElement(selector, innerSelector);
    const element = await root.$(targetSelector);
    return element ? elementSummary(element, withWxml) : null;
  }

  async elementGetInnerElements(selector: string, targetSelector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary[]> {
    const root = await this.requireElement(selector, innerSelector);
    const elements = await root.$$(targetSelector);
    return Promise.all(elements.map((element) => elementSummary(element, withWxml)));
  }

  async elementGetStyles(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>> {
    const element = await this.requireElement(selector, innerSelector);
    const entries = await Promise.all(names.map(async (name) => [name, await safeCall(() => element.style(name), null)] as const));
    return Object.fromEntries(entries);
  }

  async elementGetWxml(selector: string, outer = false, innerSelector?: string): Promise<string> {
    const element = await this.requireElement(selector, innerSelector);
    return outer ? element.outerWxml() : element.wxml();
  }

  async elementInput(selector: string, value: string, innerSelector?: string): Promise<void> {
    const element = await this.requireElement(selector, innerSelector);
    if (!isInputElement(element)) {
      throw new WeappMcpError("INVALID_ELEMENT_TYPE", "element_input only supports input and textarea elements");
    }

    await element.input(value);
  }

  async elementScrollTo(selector: string, x: number, y: number, innerSelector?: string): Promise<void> {
    const element = await this.requireElement(selector, innerSelector);
    if (!isScrollViewElement(element)) {
      throw new WeappMcpError("INVALID_ELEMENT_TYPE", "element_scrollTo only supports scroll-view elements");
    }

    await element.scrollTo(x, y);
  }

  async elementSetData(selector: string, data: Record<string, unknown>, innerSelector?: string): Promise<void> {
    const element = await this.requireElement(selector, innerSelector);
    if (!isCustomElement(element)) {
      throw new WeappMcpError("INVALID_ELEMENT_TYPE", "element_setData only supports custom components");
    }

    await element.setData(data);
  }

  async elementTap(selector: string, waitMs = 0, innerSelector?: string): Promise<void> {
    const element = await this.requireElement(selector, innerSelector);
    await element.tap();
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  async close(): Promise<void> {
    if (this.autoClose) {
      await this.miniProgram.close();
      return;
    }

    this.miniProgram.disconnect();
  }

  disconnect(): void {
    this.miniProgram.disconnect();
  }

  private pushLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }

  private async requireCurrentPage(): Promise<PageLike> {
    return ensure(await this.miniProgram.currentPage(), "No current page is available", "NOT_FOUND");
  }

  private async resolveFromPage(selector: string, innerSelector?: string): Promise<ElementLike | null> {
    const page = await this.requireCurrentPage();
    const root = await page.$(selector);
    if (!root) {
      return null;
    }

    if (!innerSelector) {
      return root;
    }

    return root.$(innerSelector);
  }

  private async requireElement(selector: string, innerSelector?: string): Promise<ElementLike> {
    return ensure(await this.resolveFromPage(selector, innerSelector), `Element '${innerSelector ?? selector}' was not found`, "NOT_FOUND");
  }
}

export class MiniprogramAutomatorFactory implements AdapterFactory {
  async create(connection?: ConnectionOptions): Promise<AdapterSession> {
    const mode = connection?.mode ?? "auto";
    const automator = getAutomator();
    let miniProgram: MiniProgramLike;

    if (mode === "connect" || (mode === "auto" && connection?.wsEndpoint)) {
      if (!connection?.wsEndpoint) {
        throw new WeappMcpError("INVALID_ARGUMENT", "wsEndpoint is required when mode is 'connect'");
      }

      miniProgram = await automator.connect({ wsEndpoint: connection.wsEndpoint });
    } else if (mode === "launch" || (mode === "auto" && connection?.projectPath)) {
      if (!connection?.projectPath) {
        throw new WeappMcpError("INVALID_ARGUMENT", "projectPath is required when mode is 'launch'");
      }

      miniProgram = await automator.launch({
        account: connection.account,
        args: Array.isArray(connection.args) ? connection.args : undefined,
        cliPath: connection.cliPath,
        cwd: connection.cwd,
        port: connection.port,
        projectPath: connection.projectPath,
        ticket: connection.ticket,
        timeout: connection.timeout,
        trustProject: connection.trustProject
      });
    } else {
      throw new WeappMcpError("INVALID_ARGUMENT", "connection.mode 'auto' requires either wsEndpoint or projectPath when no cached session exists");
    }

    return new WechatDevtoolsAdapterSession(connection, mode, await getSdkVersion(miniProgram), miniProgram, connection?.autoClose ?? true);
  }
}

import type { AdapterFactory, AdapterSession } from "../../src/adapter/contracts.js";
import type { ConnectionOptions, ElementSummary, LogEntry, PageSummary } from "../../src/types.js";

function defaultPage(): PageSummary {
  return {
    path: "/pages/index/index",
    query: {},
    width: 375,
    height: 812,
    scrollTop: 0
  };
}

function defaultElement(selector: string, withWxml = false): ElementSummary {
  return {
    tagName: selector.includes("input") ? "input" : "view",
    text: selector,
    value: selector.includes("input") ? "" : null,
    size: {
      width: 100,
      height: 24
    },
    offset: {
      left: 12,
      top: 20
    },
    outerWxml: withWxml ? `<view selector="${selector}"></view>` : undefined
  };
}

export class FakeAdapterSession implements AdapterSession {
  connection: ConnectionOptions | undefined;
  mode: "auto" | "connect" | "launch";
  sdkVersion: string | null = "3.9.0";
  logs: LogEntry[] = [
    {
      timestamp: "2026-03-18T00:00:00.000Z",
      level: "info",
      message: "ready",
      raw: { message: "ready" }
    }
  ];

  constructor(connection?: ConnectionOptions) {
    this.connection = connection;
    this.mode = connection?.mode ?? "auto";
  }

  async currentPage(): Promise<PageSummary | null> {
    return defaultPage();
  }

  async getLogs(clear = false): Promise<LogEntry[]> {
    const snapshot = [...this.logs];
    if (clear) {
      this.logs = [];
    }
    return snapshot;
  }

  async navigate(params: { path?: string; query?: Record<string, unknown>; transition?: string; waitMs?: number }): Promise<PageSummary | null> {
    return {
      ...defaultPage(),
      path: params.path ?? "/pages/index/index",
      query: params.query ?? {}
    };
  }

  async screenshot(path?: string): Promise<{ path?: string; data?: string }> {
    return path ? { path } : { data: "ZmFrZS1wbmc=" };
  }

  async callWx(method: string, args?: unknown[]): Promise<unknown> {
    return { method, args: args ?? [] };
  }

  async pageCallMethod(method: string, args?: unknown[]): Promise<unknown> {
    return { method, args: args ?? [] };
  }

  async pageGetData(path?: string): Promise<unknown> {
    return path ? { path, value: "ok" } : { ready: true };
  }

  async pageSetData(data: Record<string, unknown>): Promise<void> {
    void data;
  }

  async pageGetElement(selector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary | null> {
    return defaultElement(innerSelector ?? selector, withWxml);
  }

  async pageGetElements(selector: string, withWxml = false): Promise<ElementSummary[]> {
    return [defaultElement(`${selector}:1`, withWxml), defaultElement(`${selector}:2`, withWxml)];
  }

  async pageWaitElement(selector: string): Promise<ElementSummary> {
    return defaultElement(selector);
  }

  async pageWaitTimeout(milliseconds: number): Promise<void> {
    void milliseconds;
  }

  async elementCallMethod(selector: string, method: string, args?: unknown[], innerSelector?: string): Promise<unknown> {
    return { selector, innerSelector, method, args: args ?? [] };
  }

  async elementGetAttributes(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>> {
    return Object.fromEntries(names.map((name) => [name, `${innerSelector ?? selector}:${name}`]));
  }

  async elementGetBoundingClientRect(selector: string, innerSelector?: string) {
    void selector;
    void innerSelector;
    return {
      left: 10,
      top: 20,
      right: 110,
      bottom: 60,
      width: 100,
      height: 40
    };
  }

  async elementGetData(selector: string, path?: string, innerSelector?: string): Promise<unknown> {
    return { selector, innerSelector, path: path ?? null };
  }

  async elementGetInnerElement(selector: string, targetSelector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary | null> {
    return defaultElement(`${selector}:${innerSelector ?? "root"}:${targetSelector}`, withWxml);
  }

  async elementGetInnerElements(selector: string, targetSelector: string, withWxml = false, innerSelector?: string): Promise<ElementSummary[]> {
    return [
      defaultElement(`${selector}:${innerSelector ?? "root"}:${targetSelector}:1`, withWxml),
      defaultElement(`${selector}:${innerSelector ?? "root"}:${targetSelector}:2`, withWxml)
    ];
  }

  async elementGetStyles(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>> {
    return Object.fromEntries(names.map((name) => [name, `${innerSelector ?? selector}:${name}:style`]));
  }

  async elementGetWxml(selector: string, outer?: boolean, innerSelector?: string): Promise<string> {
    return `<${outer ? "outer" : "inner"} selector="${innerSelector ?? selector}"></${outer ? "outer" : "inner"}>`;
  }

  async elementInput(selector: string, value: string, innerSelector?: string): Promise<void> {
    if ((innerSelector ?? selector).includes("bad")) {
      throw new Error("element_input only supports input and textarea elements");
    }

    void value;
  }

  async elementScrollTo(selector: string, x: number, y: number, innerSelector?: string): Promise<void> {
    void selector;
    void x;
    void y;
    void innerSelector;
  }

  async elementSetData(selector: string, data: Record<string, unknown>, innerSelector?: string): Promise<void> {
    void selector;
    void data;
    void innerSelector;
  }

  async elementTap(selector: string, waitMs?: number, innerSelector?: string): Promise<void> {
    void selector;
    void waitMs;
    void innerSelector;
  }

  async close(): Promise<void> {}

  disconnect(): void {}
}

export class FakeAdapterFactory implements AdapterFactory {
  createCount = 0;

  async create(connection?: ConnectionOptions): Promise<AdapterSession> {
    this.createCount += 1;
    return new FakeAdapterSession(connection);
  }
}

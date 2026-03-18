import type { ConnectionOptions, ElementSummary, LogEntry, PageSummary } from "../types.js";

export interface PageLike {
  path: string;
  query: Record<string, unknown>;
  waitFor(condition: string | number | Function): Promise<void>;
  $(selector: string): Promise<ElementLike | null>;
  $$(selector: string): Promise<ElementLike[]>;
  data(path?: string): Promise<unknown>;
  setData(data: Record<string, unknown>): Promise<void>;
  size(): Promise<{ width: string; height: string }>;
  callMethod(method: string, ...args: unknown[]): Promise<unknown>;
  scrollTop(): Promise<string | string[]>;
}

export interface ElementLike {
  tagName: string;
  $(selector: string): Promise<ElementLike | null>;
  $$(selector: string): Promise<ElementLike[]>;
  size(): Promise<{ width: string; height: string }>;
  offset(): Promise<unknown>;
  text(): Promise<string>;
  attribute(name: string): Promise<string>;
  value(): Promise<unknown>;
  wxml(): Promise<string>;
  outerWxml(): Promise<string>;
  style(name: string): Promise<string>;
  tap(): Promise<void>;
}

export interface MiniProgramLike {
  pageStack(): Promise<PageLike[]>;
  navigateTo(url: string): Promise<PageLike | undefined>;
  redirectTo(url: string): Promise<PageLike | undefined>;
  navigateBack(): Promise<PageLike | undefined>;
  reLaunch(url: string): Promise<PageLike | undefined>;
  switchTab(url: string): Promise<PageLike | undefined>;
  currentPage(): Promise<PageLike | undefined>;
  callWxMethod(method: string, ...args: unknown[]): Promise<unknown>;
  screenshot(options?: { path?: string }): Promise<string | void>;
  close(): Promise<void>;
  disconnect(): void;
  on(event: "console" | "exception", listener: (...args: unknown[]) => void): this;
}

export interface AdapterSession {
  connection: ConnectionOptions | undefined;
  mode: "auto" | "connect" | "launch";
  sdkVersion: string | null;
  currentPage(): Promise<PageSummary | null>;
  getLogs(clear?: boolean): Promise<LogEntry[]>;
  navigate(params: {
    path?: string;
    query?: Record<string, unknown>;
    transition?: string;
    waitMs?: number;
  }): Promise<PageSummary | null>;
  screenshot(path?: string): Promise<{ path?: string; data?: string }>;
  callWx(method: string, args?: unknown[]): Promise<unknown>;
  pageCallMethod(method: string, args?: unknown[]): Promise<unknown>;
  pageGetData(path?: string): Promise<unknown>;
  pageSetData(data: Record<string, unknown>): Promise<void>;
  pageGetElement(selector: string, withWxml?: boolean, innerSelector?: string): Promise<ElementSummary | null>;
  pageGetElements(selector: string, withWxml?: boolean): Promise<ElementSummary[]>;
  pageWaitElement(selector: string, timeoutMs?: number): Promise<ElementSummary>;
  pageWaitTimeout(milliseconds: number): Promise<void>;
  elementCallMethod(selector: string, method: string, args?: unknown[], innerSelector?: string): Promise<unknown>;
  elementGetAttributes(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>>;
  elementGetBoundingClientRect(selector: string, innerSelector?: string): Promise<import("../types.js").BoundingRect>;
  elementGetData(selector: string, path?: string, innerSelector?: string): Promise<unknown>;
  elementGetInnerElement(selector: string, targetSelector: string, withWxml?: boolean, innerSelector?: string): Promise<ElementSummary | null>;
  elementGetInnerElements(selector: string, targetSelector: string, withWxml?: boolean, innerSelector?: string): Promise<ElementSummary[]>;
  elementGetStyles(selector: string, names: string[], innerSelector?: string): Promise<Record<string, string | null>>;
  elementGetWxml(selector: string, outer?: boolean, innerSelector?: string): Promise<string>;
  elementInput(selector: string, value: string, innerSelector?: string): Promise<void>;
  elementScrollTo(selector: string, x: number, y: number, innerSelector?: string): Promise<void>;
  elementSetData(selector: string, data: Record<string, unknown>, innerSelector?: string): Promise<void>;
  elementTap(selector: string, waitMs?: number, innerSelector?: string): Promise<void>;
  close(): Promise<void>;
  disconnect(): void;
}

export interface AdapterFactory {
  create(connection?: ConnectionOptions): Promise<AdapterSession>;
}

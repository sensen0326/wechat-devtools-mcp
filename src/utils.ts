import path from "node:path";
import { WeappMcpError } from "./errors.js";
import type { BoundingRect, ConnectionOptions, ElementSummary, NormalizedConnectionOptions } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export function parseArgs(args?: string | string[]): string[] {
  if (!args) {
    return [];
  }

  if (Array.isArray(args)) {
    return args.filter(Boolean);
  }

  const matches = args.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return matches.map((token) => token.replace(/^['"]|['"]$/g, ""));
}

export function normalizeConnectionOptions(input?: ConnectionOptions): NormalizedConnectionOptions {
  return {
    account: input?.account || undefined,
    args: parseArgs(input?.args),
    autoClose: input?.autoClose ?? true,
    cliPath: input?.cliPath ? path.normalize(input.cliPath) : undefined,
    cwd: input?.cwd ? path.normalize(input.cwd) : undefined,
    mode: input?.mode ?? "auto",
    port: input?.port,
    projectPath: input?.projectPath ? path.normalize(input.projectPath) : undefined,
    ticket: input?.ticket || undefined,
    timeout: input?.timeout ?? DEFAULT_TIMEOUT_MS,
    trustProject: input?.trustProject ?? false,
    wsEndpoint: input?.wsEndpoint || undefined
  };
}

export function makeConnectionKey(options: NormalizedConnectionOptions): string {
  return JSON.stringify({
    account: options.account ?? null,
    args: options.args,
    cliPath: options.cliPath ?? null,
    cwd: options.cwd ?? null,
    mode: options.mode,
    port: options.port ?? null,
    projectPath: options.projectPath ?? null,
    ticket: options.ticket ?? null,
    timeout: options.timeout,
    trustProject: options.trustProject,
    wsEndpoint: options.wsEndpoint ?? null
  });
}

export function ensure<T>(value: T | null | undefined, message: string, code = "INVALID_STATE"): T {
  if (value === null || value === undefined) {
    throw new WeappMcpError(code, message);
  }

  return value;
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeQuery(query?: Record<string, unknown>): Record<string, unknown> {
  return query ?? {};
}

export function appendQuery(pathname: string, query?: Record<string, unknown>): string {
  if (!query || Object.keys(query).length === 0) {
    return pathname;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      search.append(key, String(value));
    }
  }

  const suffix = search.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function normalizeOffset(offset: unknown): { left: number | null; top: number | null } {
  const record = typeof offset === "object" && offset ? (offset as Record<string, unknown>) : {};
  return {
    left: toNumber(record.left ?? record.x),
    top: toNumber(record.top ?? record.y)
  };
}

export function toBoundingRect(summary: ElementSummary): BoundingRect {
  const { left, top } = summary.offset;
  const { width, height } = summary.size;

  return {
    left,
    top,
    right: left !== null && width !== null ? left + width : null,
    bottom: top !== null && height !== null ? top + height : null,
    width,
    height
  };
}

export function createTextResult(payload: unknown): { type: "text"; text: string } {
  return {
    type: "text",
    text: JSON.stringify(payload, null, 2)
  };
}

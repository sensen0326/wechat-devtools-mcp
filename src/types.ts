export type ConnectionMode = "auto" | "connect" | "launch";

export interface ConnectionOptions {
  account?: string;
  args?: string | string[];
  autoClose?: boolean;
  cliPath?: string;
  cwd?: string;
  mode?: ConnectionMode;
  port?: number;
  projectPath?: string;
  ticket?: string;
  timeout?: number;
  trustProject?: boolean;
  wsEndpoint?: string;
}

export interface NormalizedConnectionOptions {
  account?: string;
  args: string[];
  autoClose: boolean;
  cliPath?: string;
  cwd?: string;
  mode: ConnectionMode;
  port?: number;
  projectPath?: string;
  ticket?: string;
  timeout: number;
  trustProject: boolean;
  wsEndpoint?: string;
}

export interface PageSummary {
  path: string;
  query: Record<string, unknown>;
  width: number | null;
  height: number | null;
  scrollTop: number | null;
  data?: unknown;
}

export interface ElementSummary {
  tagName: string;
  text: string | null;
  value: unknown;
  size: {
    width: number | null;
    height: number | null;
  };
  offset: {
    left: number | null;
    top: number | null;
  };
  outerWxml?: string;
}

export interface BoundingRect {
  left: number | null;
  top: number | null;
  right: number | null;
  bottom: number | null;
  width: number | null;
  height: number | null;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "error";
  message: string;
  raw: unknown;
}

export interface SessionInfo {
  key: string;
  mode: ConnectionMode;
  target: {
    account?: string;
    cliPath?: string;
    cwd?: string;
    port?: number;
    projectPath?: string;
    ticket?: string;
    timeout: number;
    trustProject: boolean;
    wsEndpoint?: string;
  };
  sdkVersion: string | null;
  currentPage: PageSummary | null;
}

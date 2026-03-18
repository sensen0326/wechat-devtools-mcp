export class WeappMcpError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "WeappMcpError";
    this.code = code;
    this.details = details;
  }
}

export function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

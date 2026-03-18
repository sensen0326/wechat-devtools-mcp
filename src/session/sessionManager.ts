import type { AdapterFactory, AdapterSession } from "../adapter/contracts.js";
import type { ConnectionOptions, SessionInfo } from "../types.js";
import { WeappMcpError } from "../errors.js";
import { makeConnectionKey, normalizeConnectionOptions } from "../utils.js";

interface SessionRecord {
  key: string;
  createdAt: string;
  session: AdapterSession;
}

export class SessionManager {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly adapterFactory: AdapterFactory) {}

  async ensureConnection(connection?: ConnectionOptions, reconnect = false): Promise<SessionRecord> {
    const normalized = normalizeConnectionOptions(connection);
    const requestedKey = makeConnectionKey(normalized);
    const hasTarget = Boolean(normalized.wsEndpoint || normalized.projectPath || normalized.mode !== "auto");
    const existing = this.sessions.get(requestedKey);

    if (existing && !reconnect) {
      return existing;
    }

    if (existing && reconnect) {
      await this.closeRecord(existing);
      this.sessions.delete(requestedKey);
    }

    if (!hasTarget && this.sessions.size === 1) {
      const only = [...this.sessions.values()][0];
      if (only) {
        return only;
      }
    }

    if (!hasTarget && this.sessions.size > 1) {
      throw new WeappMcpError("AMBIGUOUS_SESSION", "Multiple sessions are active. Pass a connection target to disambiguate.");
    }

    const session = await this.adapterFactory.create({
      ...normalized,
      args: normalized.args
    });

    const record: SessionRecord = {
      key: requestedKey,
      createdAt: new Date().toISOString(),
      session
    };

    this.sessions.set(requestedKey, record);
    return record;
  }

  async getSessionInfo(connection?: ConnectionOptions, reconnect = false): Promise<SessionInfo> {
    const record = await this.ensureConnection(connection, reconnect);
    return {
      key: record.key,
      mode: record.session.mode,
      target: {
        account: record.session.connection?.account,
        cliPath: record.session.connection?.cliPath,
        cwd: record.session.connection?.cwd,
        port: record.session.connection?.port,
        projectPath: record.session.connection?.projectPath,
        ticket: record.session.connection?.ticket,
        timeout: record.session.connection?.timeout ?? 30_000,
        trustProject: record.session.connection?.trustProject ?? false,
        wsEndpoint: record.session.connection?.wsEndpoint
      },
      sdkVersion: record.session.sdkVersion,
      currentPage: await record.session.currentPage()
    };
  }

  async closeAll(): Promise<void> {
    for (const record of this.sessions.values()) {
      await this.closeRecord(record);
    }

    this.sessions.clear();
  }

  private async closeRecord(record: SessionRecord): Promise<void> {
    try {
      await record.session.close();
    } catch {
      record.session.disconnect();
    }
  }
}

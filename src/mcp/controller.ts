import type { SessionManager } from "../session/sessionManager.js";
import type { ConnectionOptions, SessionInfo } from "../types.js";

export class WeappToolController {
  constructor(private readonly sessionManager: SessionManager) {}

  ensureConnection(connection?: ConnectionOptions, reconnect?: boolean): Promise<SessionInfo> {
    return this.sessionManager.getSessionInfo(connection, reconnect ?? false);
  }

  async navigate(params: {
    connection?: ConnectionOptions;
    path?: string;
    query?: Record<string, unknown>;
    transition?: string;
    waitMs?: number;
  }) {
    const record = await this.sessionManager.ensureConnection(params.connection);
    return record.session.navigate(params);
  }

  async currentPage(connection?: ConnectionOptions, withData?: boolean) {
    const record = await this.sessionManager.ensureConnection(connection);
    const page = await record.session.currentPage();
    if (!page || !withData) {
      return page;
    }

    return { ...page, data: await record.session.pageGetData() };
  }

  async getLogs(connection?: ConnectionOptions, clear?: boolean) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.getLogs(clear);
  }

  async screenshot(connection?: ConnectionOptions, path?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.screenshot(path);
  }

  async callWx(connection: ConnectionOptions | undefined, method: string, args?: unknown[]) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.callWx(method, args);
  }

  async pageCallMethod(connection: ConnectionOptions | undefined, method: string, args?: unknown[]) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.pageCallMethod(method, args);
  }

  async pageGetData(connection: ConnectionOptions | undefined, path?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.pageGetData(path);
  }

  async pageSetData(connection: ConnectionOptions | undefined, data: Record<string, unknown>) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.pageSetData(data);
    return { ok: true };
  }

  async pageGetElement(connection: ConnectionOptions | undefined, selector: string, withWxml?: boolean, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.pageGetElement(selector, withWxml, innerSelector);
  }

  async pageGetElements(connection: ConnectionOptions | undefined, selector: string, withWxml?: boolean) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.pageGetElements(selector, withWxml);
  }

  async pageWaitElement(connection: ConnectionOptions | undefined, selector: string, timeoutMs?: number) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.pageWaitElement(selector, timeoutMs);
  }

  async pageWaitTimeout(connection: ConnectionOptions | undefined, milliseconds: number) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.pageWaitTimeout(milliseconds);
    return { ok: true };
  }

  async elementCallMethod(connection: ConnectionOptions | undefined, selector: string, method: string, args?: unknown[], innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementCallMethod(selector, method, args, innerSelector);
  }

  async elementGetAttributes(connection: ConnectionOptions | undefined, selector: string, names: string[], innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetAttributes(selector, names, innerSelector);
  }

  async elementGetBoundingClientRect(connection: ConnectionOptions | undefined, selector: string, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetBoundingClientRect(selector, innerSelector);
  }

  async elementGetData(connection: ConnectionOptions | undefined, selector: string, path?: string, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetData(selector, path, innerSelector);
  }

  async elementGetInnerElement(connection: ConnectionOptions | undefined, selector: string, targetSelector: string, withWxml?: boolean, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetInnerElement(selector, targetSelector, withWxml, innerSelector);
  }

  async elementGetInnerElements(connection: ConnectionOptions | undefined, selector: string, targetSelector: string, withWxml?: boolean, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetInnerElements(selector, targetSelector, withWxml, innerSelector);
  }

  async elementGetStyles(connection: ConnectionOptions | undefined, selector: string, names: string[], innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetStyles(selector, names, innerSelector);
  }

  async elementGetWxml(connection: ConnectionOptions | undefined, selector: string, outer?: boolean, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    return record.session.elementGetWxml(selector, outer, innerSelector);
  }

  async elementInput(connection: ConnectionOptions | undefined, selector: string, value: string, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.elementInput(selector, value, innerSelector);
    return { ok: true };
  }

  async elementScrollTo(connection: ConnectionOptions | undefined, selector: string, x: number, y: number, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.elementScrollTo(selector, x, y, innerSelector);
    return { ok: true };
  }

  async elementSetData(connection: ConnectionOptions | undefined, selector: string, data: Record<string, unknown>, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.elementSetData(selector, data, innerSelector);
    return { ok: true };
  }

  async elementTap(connection: ConnectionOptions | undefined, selector: string, waitMs?: number, innerSelector?: string) {
    const record = await this.sessionManager.ensureConnection(connection);
    await record.session.elementTap(selector, waitMs, innerSelector);
    return { ok: true };
  }
}

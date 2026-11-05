import { AuthService } from './AuthService';
import { IS_DEV } from './env';
import { mergeData, sameValue } from './merge';

/**
 * RemoteSync - keeps the shared JSON document on the server in sync with localStorage.
 * Only active in production (IS_DEV === false). In dev everything stays in localStorage.
 *
 * - localStorage remains the working copy (fast, works offline for a moment).
 * - Every save is pushed (debounced) to /api/data with the server version it was based on.
 * - If somebody else saved first (409), the latest server data is merged with the local changes
 *   record by record (see merge.ts) and the push is retried. Nothing is discarded and nobody is asked.
 * - Other people's changes are picked up when the tab gets focus and every few minutes,
 *   and the UI is refreshed through REMOTE_UPDATED_EVENT (no page reload).
 */

const DATA_KEY = 'expenses_2026_all';
const VERSION_KEY = 'expenses_2026_server_version';
const DIRTY_KEY = 'expenses_2026_sync_dirty';
const BASE_KEY = 'expenses_2026_sync_base';
const API_URL = '/api/data';
const PUSH_DELAY_MS = 800;
const FOCUS_CHECK_MIN_INTERVAL_MS = 15000;
const POLL_INTERVAL_MS = 120000;
const MAX_SYNC_ATTEMPTS = 5;

export const REMOTE_UPDATED_EVENT = 'expenses:remote-updated';

interface RemoteDoc {
  version: number;
  data: any | null;
  unchanged?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

class ConflictError extends Error {}

const MEANINGFUL_TABLES = [
  'creditCards',
  'creditCardsMonthly',
  'investments',
  'debts',
  'services',
  'expenses',
];

function hasMeaningfulData(data: any): boolean {
  if (!data) return false;
  return MEANINGFUL_TABLES.some((t) => Array.isArray(data[t]) && data[t].length > 0);
}

export class RemoteSync {
  public static readonly enabled = !IS_DEV;

  private static timer: number | undefined;
  private static pushing = false;
  private static lastCheck = 0;
  private static backgroundStarted = false;

  private static getVersion(): number {
    return Number(localStorage.getItem(VERSION_KEY) || 0);
  }

  private static isDirty(): boolean {
    return localStorage.getItem(DIRTY_KEY) === '1';
  }

  private static getLocalData(): any | null {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Data as it was the last time this browser synced with the server (common ancestor for merging). */
  private static getBase(): any | null {
    try {
      const raw = localStorage.getItem(BASE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private static setBase(data: any): void {
    localStorage.setItem(BASE_KEY, JSON.stringify(data));
  }

  private static emitRemoteUpdated(): void {
    window.dispatchEvent(new CustomEvent(REMOTE_UPDATED_EVENT));
  }

  private static async request(method: 'GET' | 'PUT', body?: unknown, query = ''): Promise<Response> {
    const token = AuthService.getIdToken();
    if (!token) {
      // Session expired: local data is kept (dirty flag stays), user signs in again
      AuthService.logout();
      window.location.reload();
      throw new Error('AUTH_EXPIRED');
    }

    const res = await fetch(`${API_URL}${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });

    if (res.status === 401) {
      AuthService.logout();
      window.location.reload();
      throw new Error('AUTH_EXPIRED');
    }
    if (res.status === 403) {
      throw new Error('NOT_AUTHORIZED');
    }
    return res;
  }

  /**
   * @param since when given and the server is still at that version, the server answers
   *              { unchanged: true } without the data (cheap polling)
   */
  private static async fetchRemote(since?: number): Promise<RemoteDoc> {
    const res = await this.request('GET', undefined, since === undefined ? '' : `?since=${since}`);
    if (!res.ok) throw new Error('SYNC_FAILED');
    return (await res.json()) as RemoteDoc;
  }

  private static applyRemote(remote: RemoteDoc): void {
    localStorage.setItem(DATA_KEY, JSON.stringify(remote.data));
    localStorage.setItem(VERSION_KEY, String(remote.version));
    this.setBase(remote.data);
    localStorage.removeItem(DIRTY_KEY);
  }

  /**
   * Send local data to the server based on the currently known server version.
   */
  private static async push(): Promise<void> {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    // Nothing changed since the last sync: nothing to send
    const base = this.getBase();
    if (base && localStorage.getItem(VERSION_KEY) !== null && sameValue(base, data)) {
      localStorage.removeItem(DIRTY_KEY);
      return;
    }

    const res = await this.request('PUT', { baseVersion: this.getVersion(), data });
    if (res.ok) {
      const result = (await res.json()) as { version: number };
      localStorage.setItem(VERSION_KEY, String(result.version));
      this.setBase(data);
      // Only clear the flag if nothing new was saved while the request was in flight
      if (localStorage.getItem(DATA_KEY) === raw) localStorage.removeItem(DIRTY_KEY);
      return;
    }
    if (res.status === 409) throw new ConflictError();
    throw new Error('SYNC_FAILED');
  }

  /**
   * Somebody else saved first: merge their latest data with the local changes (record by record).
   * Returns true when the merge brought in changes from other users.
   */
  private static async mergeWithRemote(): Promise<boolean> {
    const remote = await this.fetchRemote();
    const local = this.getLocalData();
    localStorage.setItem(VERSION_KEY, String(remote.version));

    if (remote.data == null || !local) return false;

    const merged = mergeData(this.getBase(), local, remote.data);
    const pulledChanges = !sameValue(merged, local);

    localStorage.setItem(DATA_KEY, JSON.stringify(merged));
    this.setBase(remote.data);
    localStorage.setItem(DIRTY_KEY, '1');
    return pulledChanges;
  }

  /**
   * Push local changes, merging with newer server data when needed.
   * Returns true when data from other users was merged in (the UI should refresh).
   */
  private static async syncNow(): Promise<boolean> {
    let pulled = false;
    for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt++) {
      try {
        await this.push();
        return pulled;
      } catch (error) {
        if (!(error instanceof ConflictError) || attempt === MAX_SYNC_ATTEMPTS) throw error;
        pulled = (await this.mergeWithRemote()) || pulled;
      }
    }
    return pulled;
  }

  /**
   * Called once after login, before the app is shown.
   * Loads the shared data into localStorage (or seeds the server from this browser).
   */
  public static async initialSync(): Promise<void> {
    if (!this.enabled) return;

    const remote = await this.fetchRemote();
    const local = this.getLocalData();
    const neverSynced = localStorage.getItem(VERSION_KEY) === null;
    const remoteHasData = hasMeaningfulData(remote.data);

    // Server empty (or only default data) and this browser has real data and was never synced:
    // use this browser to seed the shared document.
    if (!remoteHasData && hasMeaningfulData(local) && neverSynced) {
      localStorage.setItem(VERSION_KEY, String(remote.version));
      await this.syncNow();
      return;
    }

    if (remote.data == null) {
      // Nothing on the server and nothing worth seeding
      return;
    }

    // Unsynced local changes (e.g. the tab was closed before they were sent): merge, never discard
    if (this.isDirty() && local) {
      if (remote.version !== this.getVersion()) {
        const merged = mergeData(this.getBase(), local, remote.data);
        localStorage.setItem(DATA_KEY, JSON.stringify(merged));
        localStorage.setItem(VERSION_KEY, String(remote.version));
        this.setBase(remote.data);
      }
      await this.syncNow();
      return;
    }

    this.applyRemote(remote);
  }

  /**
   * Called by DataService after every local save.
   */
  public static schedulePush(): void {
    if (!this.enabled) return;
    localStorage.setItem(DIRTY_KEY, '1');
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.flush(), PUSH_DELAY_MS);
  }

  private static async flush(): Promise<void> {
    if (this.pushing) {
      this.timer = window.setTimeout(() => void this.flush(), PUSH_DELAY_MS);
      return;
    }
    this.pushing = true;
    try {
      const pulled = await this.syncNow();
      if (pulled) this.emitRemoteUpdated();
    } catch (error) {
      // Network or server problem: data stays local and dirty, retried on next save / reconnect
      console.error('Sync failed (will retry):', error);
    } finally {
      this.pushing = false;
    }
  }

  /**
   * Retry pending pushes when back online and pick up other users' changes
   * when the tab regains focus and every few minutes while it is visible.
   */
  public static startBackgroundSync(): void {
    if (!this.enabled || this.backgroundStarted) return;
    this.backgroundStarted = true;

    window.addEventListener('online', () => {
      if (this.isDirty()) void this.flush();
    });

    const checkForUpdates = async () => {
      if (document.visibilityState !== 'visible') return;
      if (this.pushing) return;
      const now = Date.now();
      if (now - this.lastCheck < FOCUS_CHECK_MIN_INTERVAL_MS) return;
      this.lastCheck = now;

      if (this.isDirty()) {
        // Pending local changes: sending them also merges any newer server data
        void this.flush();
        return;
      }

      try {
        const remote = await this.fetchRemote(this.getVersion());
        if (remote.unchanged || remote.data == null || remote.version <= this.getVersion()) return;
        // Something was saved locally while we were asking: the next push will merge instead
        if (this.isDirty()) return;
        this.applyRemote(remote);
        this.emitRemoteUpdated();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    window.addEventListener('focus', () => void checkForUpdates());
    document.addEventListener('visibilitychange', () => void checkForUpdates());
    window.setInterval(() => void checkForUpdates(), POLL_INTERVAL_MS);
  }
}

export default RemoteSync;

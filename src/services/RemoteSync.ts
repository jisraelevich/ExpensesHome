import { AuthService } from './AuthService';
import { IS_DEV } from './env';

/**
 * RemoteSync - keeps the shared JSON document on the server in sync with localStorage.
 * Only active in production (IS_DEV === false). In dev everything stays in localStorage.
 *
 * - localStorage remains the working copy (fast, works offline for a moment).
 * - Every save is pushed (debounced) to /api/data with the version it was based on.
 * - If the server version is newer (someone else saved), the push is rejected (409)
 *   and the latest server data is loaded instead.
 */

const DATA_KEY = 'expenses_2026_all';
const VERSION_KEY = 'expenses_2026_server_version';
const DIRTY_KEY = 'expenses_2026_sync_dirty';
const API_URL = '/api/data';
const PUSH_DELAY_MS = 800;
const FOCUS_CHECK_MIN_INTERVAL_MS = 15000;

interface RemoteDoc {
  version: number;
  data: any | null;
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
  private static lastFocusCheck = 0;
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

  private static async request(method: 'GET' | 'PUT', body?: unknown): Promise<Response> {
    const token = AuthService.getIdToken();
    if (!token) {
      // Session expired: local data is kept (dirty flag stays), user signs in again
      AuthService.logout();
      window.location.reload();
      throw new Error('AUTH_EXPIRED');
    }

    const res = await fetch(API_URL, {
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

  private static async fetchRemote(): Promise<RemoteDoc> {
    const res = await this.request('GET');
    if (!res.ok) throw new Error('SYNC_FAILED');
    return (await res.json()) as RemoteDoc;
  }

  private static applyRemote(remote: RemoteDoc): void {
    localStorage.setItem(DATA_KEY, JSON.stringify(remote.data));
    localStorage.setItem(VERSION_KEY, String(remote.version));
    localStorage.removeItem(DIRTY_KEY);
  }

  /**
   * Send local data to the server based on the currently known server version.
   */
  private static async push(): Promise<void> {
    const data = this.getLocalData();
    if (!data) return;

    const res = await this.request('PUT', { baseVersion: this.getVersion(), data });
    if (res.ok) {
      const result = (await res.json()) as { version: number };
      localStorage.setItem(VERSION_KEY, String(result.version));
      localStorage.removeItem(DIRTY_KEY);
      return;
    }
    if (res.status === 409) throw new ConflictError();
    throw new Error('SYNC_FAILED');
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
      await this.push();
      return;
    }

    if (remote.data == null) {
      // Nothing on the server and nothing worth seeding
      return;
    }

    // Unsynced local changes (e.g. session expired before they were sent)
    if (this.isDirty() && local) {
      if (remote.version === this.getVersion()) {
        await this.push();
        return;
      }
      const keepServer = window.confirm(
        'This browser has changes that were not saved to the server, and someone else changed the data meanwhile.\n\n' +
          'OK = load the latest server data (discard the unsaved local changes)\n' +
          'Cancel = overwrite the server with the local data'
      );
      if (!keepServer) {
        localStorage.setItem(VERSION_KEY, String(remote.version));
        await this.push();
        return;
      }
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
      await this.push();
    } catch (error) {
      if (error instanceof ConflictError) {
        try {
          const remote = await this.fetchRemote();
          this.applyRemote(remote);
          window.alert('Another user saved changes at the same time. The latest shared data was loaded, please repeat your last change.');
          window.location.reload();
        } catch (inner) {
          console.error('Conflict recovery failed:', inner);
        }
      } else {
        // Network or server problem: data stays local and dirty, retried on next save / reconnect
        console.error('Sync failed (will retry):', error);
      }
    } finally {
      this.pushing = false;
    }
  }

  /**
   * Retry pending pushes when back online and pick up other users' changes when the tab regains focus.
   */
  public static startBackgroundSync(): void {
    if (!this.enabled || this.backgroundStarted) return;
    this.backgroundStarted = true;

    window.addEventListener('online', () => {
      if (this.isDirty()) void this.flush();
    });

    const checkForUpdates = async () => {
      if (document.visibilityState !== 'visible') return;
      if (this.pushing || this.isDirty()) return;
      const now = Date.now();
      if (now - this.lastFocusCheck < FOCUS_CHECK_MIN_INTERVAL_MS) return;
      this.lastFocusCheck = now;
      try {
        const remote = await this.fetchRemote();
        if (remote.data != null && remote.version > this.getVersion()) {
          this.applyRemote(remote);
          window.location.reload();
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    window.addEventListener('focus', () => void checkForUpdates());
    document.addEventListener('visibilitychange', () => void checkForUpdates());
  }
}

export default RemoteSync;

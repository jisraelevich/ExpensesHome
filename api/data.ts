import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { del, list, put } from '@vercel/blob';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Shared data endpoint (production only).
 *
 *   GET /api/data  -> { version, data, updatedAt, updatedBy }   (data is null when nothing is saved yet)
 *   GET /api/data?since=N -> { version, unchanged: true } when the server is still at version N (cheap polling)
 *   PUT /api/data  -> body { baseVersion, data }; 409 if baseVersion is not the current version
 *
 * Every request needs "Authorization: Bearer <Google ID token>".
 * Only emails listed in ADMIN_EMAILS (comma separated) are allowed; all of them are full editors.
 *
 * The JSON document is stored encrypted (AES-256-GCM) in Vercel Blob, so the blob URL alone is useless.
 * Every save is a NEW immutable file (expenses/versions/v000000013.enc) that is never overwritten:
 * creating a file that already exists fails, which makes "two saves of the same version" impossible
 * and avoids reading stale CDN copies of an overwritten file.
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID      Google OAuth client id (same value as VITE_GOOGLE_CLIENT_ID)
 *   ADMIN_EMAILS          allowed emails
 *   DATA_ENCRYPTION_KEY   64 hex chars (32 bytes)
 *   BLOB_READ_WRITE_TOKEN added automatically when a Blob store is connected to the project
 */

const LEGACY_PATH = 'expenses/data.json.enc'; // single overwritten file used by the first release
const VERSIONS_PREFIX = 'expenses/versions/';
const BACKUP_PREFIX = 'expenses/backups/';
const KEEP_VERSIONS = 40;
const MAX_BYTES = 4 * 1024 * 1024;

interface VersionFile {
  version: number;
  url: string;
  pathname: string;
}

const versionPath = (version: number) => `${VERSIONS_PREFIX}v${String(version).padStart(9, '0')}.enc`;

interface StoredDoc {
  version: number;
  updatedAt: string;
  updatedBy: string;
  data: Record<string, unknown>;
}

const oauthClient = new OAuth2Client();

function getKey(): Buffer {
  const hex = process.env.DATA_ENCRYPTION_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('DATA_ENCRYPTION_KEY must be 64 hex characters');
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

type AuthResult = { email: string } | { status: number; error: string };

async function authenticate(req: VercelRequest): Promise<AuthResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return { status: 401, error: 'Missing token' };

  let email: string | undefined;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    if (payload?.email_verified) email = payload.email?.toLowerCase();
  } catch {
    return { status: 401, error: 'Invalid or expired token' };
  }
  if (!email) return { status: 401, error: 'Unverified account' };

  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(email)) return { status: 403, error: 'Not authorized' };

  return { email };
}

async function listVersions(): Promise<VersionFile[]> {
  const found: VersionFile[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: VERSIONS_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const match = blob.pathname.match(/v(\d{9})\.enc$/);
      if (match) found.push({ version: Number(match[1]), url: blob.url, pathname: blob.pathname });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return found.sort((a, b) => a.version - b.version);
}

async function fetchDoc(url: string): Promise<StoredDoc> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read data (${res.status})`);
  return JSON.parse(decrypt(await res.text())) as StoredDoc;
}

interface Latest {
  version: number;
  doc: StoredDoc | null; // null when nothing is stored yet, or when the caller already has this version
  unchanged: boolean;
  versions: VersionFile[];
}

/**
 * Finds the latest version by listing the version files (never a cached copy).
 * Version files are immutable, so reading one by URL is always safe.
 */
async function readLatest(sinceVersion?: number): Promise<Latest> {
  const versions = await listVersions();
  if (versions.length > 0) {
    const latest = versions[versions.length - 1];
    if (sinceVersion === latest.version) {
      return { version: latest.version, doc: null, unchanged: true, versions };
    }
    return { version: latest.version, doc: await fetchDoc(latest.url), unchanged: false, versions };
  }

  // Data saved by the first release (one overwritten file): used until the first new-style save
  const { blobs } = await list({ prefix: LEGACY_PATH, limit: 1 });
  if (blobs.length === 0) return { version: 0, doc: null, unchanged: false, versions };
  const doc = await fetchDoc(`${blobs[0].url}?t=${Date.now()}`);
  return { version: doc.version, doc, unchanged: sinceVersion === doc.version, versions };
}

/**
 * Creates the file for doc.version. Returns false when that version already exists
 * (somebody else saved first), which the caller reports as a conflict.
 */
async function writeVersion(doc: StoredDoc): Promise<boolean> {
  try {
    await put(versionPath(doc.version), encrypt(JSON.stringify(doc)), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'text/plain',
    });
    return true;
  } catch (error) {
    if (error instanceof Error && /already exists/i.test(error.message)) return false;
    throw error;
  }
}

/** Keeps only the most recent versions. Failures are ignored (it is only housekeeping). */
async function pruneVersions(versions: VersionFile[]): Promise<void> {
  if (versions.length <= KEEP_VERSIONS) return;
  try {
    await del(versions.slice(0, versions.length - KEEP_VERSIONS).map((v) => v.url));
  } catch (error) {
    console.error('api/data prune error:', error);
  }
}

/**
 * One backup per day: the state before the first change of that day.
 * Fails silently when today's backup already exists.
 */
async function backupBeforeOverwrite(existing: StoredDoc): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  try {
    await put(`${BACKUP_PREFIX}${today}.json.enc`, encrypt(JSON.stringify(existing)), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'text/plain',
    });
  } catch {
    // already exists for today
  }
}

function isValidData(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.creditCards) &&
    Array.isArray(data.investments) &&
    Array.isArray(data.debts) &&
    Array.isArray(data.expenses) &&
    data.config &&
    typeof data.config === 'object'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const auth = await authenticate(req);
    if ('status' in auth) {
      return res.status(auth.status).json({ error: auth.error });
    }

    if (req.method === 'GET') {
      const sinceParam = Array.isArray(req.query.since) ? req.query.since[0] : req.query.since;
      const since = sinceParam !== undefined && sinceParam !== '' ? Number(sinceParam) : undefined;
      const latest = await readLatest(Number.isFinite(since) ? since : undefined);
      if (latest.unchanged) {
        return res.status(200).json({ version: latest.version, unchanged: true, data: null });
      }
      return res.status(200).json({
        version: latest.version,
        data: latest.doc?.data ?? null,
        updatedAt: latest.doc?.updatedAt,
        updatedBy: latest.doc?.updatedBy,
      });
    }

    if (req.method === 'PUT') {
      const { baseVersion, data } = req.body || {};
      if (typeof baseVersion !== 'number' || !isValidData(data)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      if (JSON.stringify(data).length > MAX_BYTES) {
        return res.status(413).json({ error: 'Data too large' });
      }

      const latest = await readLatest();
      if (baseVersion !== latest.version) {
        return res.status(409).json({ error: 'Version conflict', version: latest.version });
      }

      if (latest.doc) await backupBeforeOverwrite(latest.doc);

      const next: StoredDoc = {
        version: latest.version + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.email,
        data,
      };
      if (!(await writeVersion(next))) {
        // Another save created this version between our read and our write
        return res.status(409).json({ error: 'Version conflict', version: next.version });
      }
      await pruneVersions(latest.versions);
      return res.status(200).json({ version: next.version });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('api/data error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

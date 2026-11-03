import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { list, put } from '@vercel/blob';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Shared data endpoint (production only).
 *
 *   GET /api/data  -> { version, data, updatedAt, updatedBy }   (data is null when nothing is saved yet)
 *   PUT /api/data  -> body { baseVersion, data }; 409 if baseVersion is not the current version
 *
 * Every request needs "Authorization: Bearer <Google ID token>".
 * Only emails listed in ADMIN_EMAILS (comma separated) are allowed; all of them are full editors.
 *
 * The JSON document is stored encrypted (AES-256-GCM) in Vercel Blob, so the blob URL alone is useless.
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID      Google OAuth client id (same value as VITE_GOOGLE_CLIENT_ID)
 *   ADMIN_EMAILS          allowed emails
 *   DATA_ENCRYPTION_KEY   64 hex chars (32 bytes)
 *   BLOB_READ_WRITE_TOKEN added automatically when a Blob store is connected to the project
 */

const DATA_PATH = 'expenses/data.json.enc';
const BACKUP_PREFIX = 'expenses/backups/';
const MAX_BYTES = 4 * 1024 * 1024;

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

async function readDoc(): Promise<StoredDoc | null> {
  const { blobs } = await list({ prefix: DATA_PATH, limit: 1 });
  if (blobs.length === 0) return null;
  // Query string bypasses the CDN cache so we always read the latest version
  const res = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read data (${res.status})`);
  return JSON.parse(decrypt(await res.text())) as StoredDoc;
}

async function writeDoc(doc: StoredDoc): Promise<void> {
  await put(DATA_PATH, encrypt(JSON.stringify(doc)), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'text/plain',
  });
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
      const doc = await readDoc();
      return res.status(200).json({
        version: doc?.version ?? 0,
        data: doc?.data ?? null,
        updatedAt: doc?.updatedAt,
        updatedBy: doc?.updatedBy,
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

      const existing = await readDoc();
      const currentVersion = existing?.version ?? 0;
      if (baseVersion !== currentVersion) {
        return res.status(409).json({ error: 'Version conflict', version: currentVersion });
      }

      if (existing) await backupBeforeOverwrite(existing);

      const next: StoredDoc = {
        version: currentVersion + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.email,
        data,
      };
      await writeDoc(next);
      return res.status(200).json({ version: next.version });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('api/data error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

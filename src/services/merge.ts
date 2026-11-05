/**
 * Three-way merge of the shared data document.
 *
 *   base   = the data as it was the last time this browser synced with the server
 *   local  = the data in this browser now (base + this user's changes)
 *   remote = the latest data on the server (base + other users' changes)
 *
 * Tables (arrays of records with an `id`) are merged record by record, like cells in a spreadsheet:
 *   - records added locally are added
 *   - records changed locally replace the server copy (if the server copy changed too, the newer
 *     `updatedAt` wins, ties go to local)
 *   - records deleted locally are deleted (unless someone else changed that record meanwhile)
 *   - records only changed or added by other users are kept
 * Plain objects (config) are merged key by key.
 */

type Row = { id: string; updatedAt?: string; [key: string]: unknown };

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

export function sameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function time(row: Row): number {
  const t = row.updatedAt ? Date.parse(row.updatedAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function toMap(rows: Row[]): Map<string, Row> {
  const map = new Map<string, Row>();
  for (const row of rows) {
    if (row && typeof row.id === 'string') map.set(row.id, row);
  }
  return map;
}

export function mergeTable(base: Row[], local: Row[], remote: Row[]): Row[] {
  const baseMap = toMap(base);
  const localMap = toMap(local);
  const result = toMap(remote);

  for (const row of local) {
    if (!row || typeof row.id !== 'string') continue;
    const b = baseMap.get(row.id);
    const r = result.get(row.id);
    const localChanged = !b || !sameValue(b, row);
    if (!localChanged) continue; // untouched locally: keep whatever the server has

    if (!r) {
      // New locally, or the server deleted it while it was edited here: keep the local record
      result.set(row.id, row);
      continue;
    }

    const remoteChanged = !b || !sameValue(b, r);
    if (!remoteChanged) {
      result.set(row.id, row);
    } else if (!sameValue(row, r) && time(row) >= time(r)) {
      // Both sides changed the same record: the most recent change wins
      result.set(row.id, row);
    }
  }

  // Deleted locally
  for (const [id, b] of baseMap) {
    if (localMap.has(id)) continue;
    const r = result.get(id);
    if (r && sameValue(b, r)) result.delete(id); // not touched by others: delete
  }

  return Array.from(result.values());
}

function mergeObject(
  base: Record<string, unknown>,
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...remote };
  const keys = new Set([...Object.keys(local), ...Object.keys(base)]);
  for (const key of keys) {
    if (!sameValue(base[key], local[key])) {
      if (local[key] === undefined) delete result[key];
      else result[key] = local[key];
    }
  }
  return result;
}

export function mergeData(base: any | null, local: any, remote: any): any {
  const b = base ?? {};
  const result: Record<string, unknown> = { ...remote };
  const keys = new Set([...Object.keys(local ?? {}), ...Object.keys(remote ?? {})]);

  for (const key of keys) {
    const l = local?.[key];
    const r = remote?.[key];
    if (Array.isArray(l) || Array.isArray(r)) {
      result[key] = mergeTable(
        Array.isArray(b[key]) ? b[key] : [],
        Array.isArray(l) ? l : [],
        Array.isArray(r) ? r : []
      );
    } else if (l && typeof l === 'object' && r && typeof r === 'object') {
      result[key] = mergeObject(b[key] ?? {}, l, r);
    } else if (!sameValue(b[key], l)) {
      result[key] = l;
    }
  }
  return result;
}

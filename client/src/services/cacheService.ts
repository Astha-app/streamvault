import Dexie, { type Table } from 'dexie';
import type { PlaybackState, VideoMetadata } from '@shared/types/video';
import type { AppSettings } from '../types/settings';

/**
 * IndexedDB schema via Dexie.
 *
 * IMPORTANT PRIVACY NOTE:
 * We do NOT cache full video files. Real-Debrid resolved download URLs are
 * cached with expiry (server-side) so we don't re-hit the API on every visit,
 * but we never store the video binary. This respects:
 *   1. Copyright — caching copyrighted media would be illegal in many jurisdictions
 *   2. Storage — full HD files would exhaust browser storage quotas
 *   3. Expiry — Real-Debrid download links are temporary; caching them long-term is useless
 */
class AppDatabase extends Dexie {
  history!: Table<PlaybackState, string>;
  metadata!: Table<VideoMetadata, string>;
  settings!: Table<{ key: string; value: unknown }, string>;
  subtitles!: Table<{ id: string; videoId: string; label: string; language: string; content: string; addedAt: string }, string>;

  constructor() {
    super('StreamVaultDB');
    this.version(1).stores({
      history:   'videoId, lastWatched, completed',
      metadata:  'id, addedAt',
      settings:  'key',
      subtitles: 'id, videoId, language',
    });
  }
}

export const db = new AppDatabase();

// ── Settings helpers ──────────────────────────────────────────────────────────

export async function loadSettings(): Promise<Partial<AppSettings>> {
  const rows = await db.settings.toArray();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<AppSettings>;
}

export async function saveSetting(key: keyof AppSettings, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

// ── Storage estimate ──────────────────────────────────────────────────────────

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
}

export async function clearAllAppData(): Promise<void> {
  await db.history.clear();
  await db.metadata.clear();
  await db.settings.clear();
  await db.subtitles.clear();
}

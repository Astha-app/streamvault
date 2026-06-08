import type { StreamType } from '@shared/types/video';

/** Detect stream type from URL extension and optional MIME type */
export function detectStreamType(url: string, mimeType?: string): StreamType {
  if (mimeType) {
    if (mimeType.includes('mpegurl') || mimeType.includes('m3u8')) return 'hls';
    if (mimeType.includes('dash') || mimeType.includes('mpd')) return 'dash';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
  }
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.m3u8')) return 'hls';
    if (path.endsWith('.mpd')) return 'dash';
    if (path.endsWith('.mp4')) return 'mp4';
    if (path.endsWith('.webm')) return 'webm';
    if (path.endsWith('.ogg') || path.endsWith('.ogv')) return 'ogg';
  } catch {
    // not a valid URL — fall through
  }
  return 'unknown';
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Strip query parameters for display purposes */
export function cleanUrlForDisplay(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch {
    return url.slice(0, 60) + (url.length > 60 ? '…' : '');
  }
}

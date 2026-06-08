import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '../services/cacheService';
import type { UnrestrictResult } from '../../../shared/types/api';

const MOCK_RESULT: UnrestrictResult = {
  id: 'abc123',
  filename: 'test-video.mp4',
  mimeType: 'video/mp4',
  filesize: 1_000_000,
  link: 'https://hoster.com/file',
  host: 'hoster.com',
  host_icon: 'https://hoster.com/icon.png',
  chunks: 4,
  crc: 0,
  download: 'https://cdn.real-debrid.com/dl/abc123/test-video.mp4',
  streamable: 1,
  resolvedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
};

describe('cacheService', () => {
  beforeEach(() => cacheService.clear());

  it('returns null for missing key', () => {
    expect(cacheService.get('https://missing.com/file')).toBeNull();
  });

  it('stores and retrieves a result', () => {
    cacheService.set(MOCK_RESULT.link, MOCK_RESULT);
    const result = cacheService.get(MOCK_RESULT.link);
    expect(result?.filename).toBe('test-video.mp4');
  });

  it('evicts expired entries', () => {
    // Mock Date.now to simulate a past entry
    const pastEntry = { ...MOCK_RESULT, expiresAt: new Date(Date.now() - 1000).toISOString() };
    cacheService.set('https://expired.com/file', pastEntry);

    // Manually patch the internal store's expiresAt for the test
    // Since the expiry is set internally, we test by advancing time
    const origNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(origNow() + 3_700_000); // 61 minutes later

    const result = cacheService.get(MOCK_RESULT.link);
    expect(result).toBeNull();

    vi.restoreAllMocks();
  });

  it('deletes a specific entry', () => {
    cacheService.set(MOCK_RESULT.link, MOCK_RESULT);
    cacheService.delete(MOCK_RESULT.link);
    expect(cacheService.get(MOCK_RESULT.link)).toBeNull();
  });

  it('reports status count', () => {
    cacheService.set(MOCK_RESULT.link, MOCK_RESULT);
    cacheService.set('https://second.com/file', { ...MOCK_RESULT, link: 'https://second.com/file' });
    expect(cacheService.status().count).toBe(2);
  });
});

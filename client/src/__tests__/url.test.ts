import { describe, it, expect } from 'vitest';
import { detectStreamType, isValidUrl, cleanUrlForDisplay } from '../utils/url';

describe('detectStreamType', () => {
  it('detects HLS by extension', () => expect(detectStreamType('https://cdn.example.com/video/index.m3u8')).toBe('hls'));
  it('detects DASH by extension', () => expect(detectStreamType('https://cdn.example.com/video/manifest.mpd')).toBe('dash'));
  it('detects MP4 by extension', () => expect(detectStreamType('https://cdn.example.com/video.mp4')).toBe('mp4'));
  it('detects WebM by extension', () => expect(detectStreamType('https://cdn.example.com/video.webm')).toBe('webm'));
  it('detects HLS by MIME type', () => expect(detectStreamType('https://example.com/stream', 'application/x-mpegURL')).toBe('hls'));
  it('returns unknown for unrecognised', () => expect(detectStreamType('https://example.com/video')).toBe('unknown'));
});

describe('isValidUrl', () => {
  it('accepts https URLs', () => expect(isValidUrl('https://example.com/file.mp4')).toBe(true));
  it('accepts http URLs', () => expect(isValidUrl('http://example.com/file.mp4')).toBe(true));
  it('rejects non-URLs', () => expect(isValidUrl('not a url')).toBe(false));
  it('rejects ftp', () => expect(isValidUrl('ftp://example.com/file')).toBe(false));
  it('rejects empty string', () => expect(isValidUrl('')).toBe(false));
});

describe('cleanUrlForDisplay', () => {
  it('returns hostname + path without query', () => {
    expect(cleanUrlForDisplay('https://cdn.example.com/path/file.mp4?token=abc123')).toBe('cdn.example.com/path/file.mp4');
  });
  it('handles invalid URLs by truncating', () => {
    const short = 'not-a-url';
    expect(cleanUrlForDisplay(short)).toBe(short);
  });
});

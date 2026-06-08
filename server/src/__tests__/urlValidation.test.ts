import { describe, it, expect } from 'vitest';
import { isAllowedApiHost, isValidHttpUrl, isValidUnrestrictLink } from '../utils/urlValidation';

describe('isAllowedApiHost', () => {
  it('allows Real-Debrid API hostname', () => {
    expect(isAllowedApiHost('https://api.real-debrid.com/rest/1.0/user')).toBe(true);
  });
  it('blocks other hosts', () => {
    expect(isAllowedApiHost('https://evil.com/steal')).toBe(false);
    expect(isAllowedApiHost('https://api.real-debrid.com.evil.com/')).toBe(false);
  });
  it('rejects invalid URLs', () => {
    expect(isAllowedApiHost('not-a-url')).toBe(false);
  });
});

describe('isValidHttpUrl', () => {
  it('accepts http/https', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('http://example.com')).toBe(true);
  });
  it('rejects other protocols', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('isValidUnrestrictLink', () => {
  it('accepts a valid URL under 2048 chars', () => {
    expect(isValidUnrestrictLink('https://somehost.com/file.zip')).toBe(true);
  });
  it('rejects URLs over 2048 chars', () => {
    expect(isValidUnrestrictLink('https://x.com/' + 'a'.repeat(2040))).toBe(false);
  });
  it('rejects non-URLs', () => {
    expect(isValidUnrestrictLink('magnet:?xt=urn:btih:abc')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { formatTime, formatBytes, formatDuration } from '../utils/time';

describe('formatTime', () => {
  it('formats seconds under 1 minute', () => {
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats minutes', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats hours', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(7265)).toBe('2:01:05');
  });

  it('handles negative and non-finite values', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});

describe('formatBytes', () => {
  it('formats 0 bytes', () => expect(formatBytes(0)).toBe('0 B'));
  it('formats KB', () => expect(formatBytes(1024)).toBe('1.0 KB'));
  it('formats MB', () => expect(formatBytes(1_048_576)).toBe('1.0 MB'));
  it('formats GB', () => expect(formatBytes(1_073_741_824)).toBe('1.0 GB'));
});

describe('formatDuration', () => {
  it('formats under an hour', () => expect(formatDuration(300)).toBe('5m'));
  it('formats hours', () => expect(formatDuration(3720)).toBe('1h 2m'));
  it('handles zero/negative', () => expect(formatDuration(0)).toBe('0m'));
});

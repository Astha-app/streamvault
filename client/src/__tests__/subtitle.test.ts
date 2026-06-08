import { describe, it, expect } from 'vitest';
import { srtToVtt } from '../services/subtitleService';

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:05,500 --> 00:00:08,000
This is a subtitle test
with a second line

3
00:01:00,000 --> 00:01:02,500
Final subtitle
`;

describe('srtToVtt', () => {
  it('starts with WEBVTT header', () => {
    const vtt = srtToVtt(SAMPLE_SRT);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
  });

  it('converts comma ms separator to dot', () => {
    const vtt = srtToVtt(SAMPLE_SRT);
    expect(vtt).not.toContain('00:00:01,000');
    expect(vtt).toContain('00:00:01.000');
  });

  it('preserves subtitle text', () => {
    const vtt = srtToVtt(SAMPLE_SRT);
    expect(vtt).toContain('Hello world');
    expect(vtt).toContain('with a second line');
  });

  it('strips sequence numbers', () => {
    const vtt = srtToVtt(SAMPLE_SRT);
    // Sequence numbers like "1\n" should not appear as standalone lines after header
    const lines = vtt.split('\n');
    // The only standalone numeric line after WEBVTT header would indicate a bug
    const standaloneNums = lines.filter((l, i) => i > 1 && /^\d+$/.test(l.trim()));
    expect(standaloneNums).toHaveLength(0);
  });

  it('handles Windows-style line endings', () => {
    const winSrt = '1\r\n00:00:01,000 --> 00:00:03,000\r\nText\r\n\r\n';
    const vtt = srtToVtt(winSrt);
    expect(vtt).toContain('00:00:01.000');
    expect(vtt).toContain('Text');
  });
});

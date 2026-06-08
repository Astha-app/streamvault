import type { SubtitleTrack } from '@shared/types/video';
import { nanoid } from '../utils/nanoid';

/** Convert SRT subtitle format to WebVTT */
export function srtToVtt(srt: string): string {
  // Normalise line endings
  const normalised = srt.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const blocks = normalised.split(/\n\n+/);
  const vttLines = ['WEBVTT', ''];

  for (const block of blocks) {
    const lines = block.split('\n');
    // Skip sequence number line if present
    const start = /^\d+$/.test(lines[0]) ? 1 : 0;
    if (lines.length <= start) continue;

    const timeLine = lines[start];
    // SRT uses comma for ms separator; VTT uses dot
    const converted = timeLine.replace(/,/g, '.').replace(' --> ', ' --> ');
    if (!converted.includes('-->')) continue;

    vttLines.push(converted);
    vttLines.push(...lines.slice(start + 1));
    vttLines.push('');
  }

  return vttLines.join('\n');
}

/** Create a blob URL from VTT string */
function vttToBlobUrl(vtt: string): string {
  const blob = new Blob([vtt], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

/** Load a subtitle File and return a SubtitleTrack with a blob URL */
export async function loadSubtitleFile(file: File, language = 'und'): Promise<SubtitleTrack> {
  const text = await file.text();

  let vttContent: string;
  if (file.name.endsWith('.srt')) {
    vttContent = srtToVtt(text);
  } else if (file.name.endsWith('.vtt')) {
    vttContent = text;
  } else {
    throw new Error('Unsupported subtitle format. Please use .vtt or .srt files.');
  }

  const src = vttToBlobUrl(vttContent);
  return {
    id: nanoid(),
    label: file.name.replace(/\.(srt|vtt)$/, ''),
    language,
    src,
    default: false,
  };
}

/** Revoke all blob URLs from subtitle tracks (cleanup) */
export function revokeSubtitleTracks(tracks: SubtitleTrack[]): void {
  for (const t of tracks) {
    if (t.src.startsWith('blob:')) URL.revokeObjectURL(t.src);
  }
}

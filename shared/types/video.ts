/** Shared video/media types used by both client and server */

export type StreamType = 'hls' | 'dash' | 'mp4' | 'webm' | 'ogg' | 'unknown';

export interface VideoSource {
  url: string;
  type: StreamType;
  quality?: string;
  label?: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src: string;  // blob URL or remote URL
  default?: boolean;
}

export interface AudioTrack {
  id: number | string;
  label: string;
  language: string;
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  filename: string;
  duration?: number;
  filesize?: number;
  mimeType?: string;
  host?: string;
  host_icon?: string;
  thumbnail?: string;
  resolvedUrl?: string;
  originalLink?: string;
  addedAt: string;
  chapters?: Chapter[];
}

export interface PlaybackState {
  videoId: string;
  url: string;
  currentTime: number;
  duration: number;
  progress: number;       // 0–1
  completed: boolean;
  lastWatched: string;    // ISO
  rewatchCount: number;
  totalWatchTime: number; // seconds accumulated across sessions
}

export type PlaybackMode = 'normal' | 'theater' | 'fullscreen' | 'pip' | 'mini';

export interface QualityLevel {
  id: number;
  label: string;
  height: number;
  bitrate: number;
}

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  volume: number;
  muted: boolean;
  playbackRate: number;
  mode: PlaybackMode;
  loading: boolean;
  error: string | null;
  pip: boolean;
  loop: boolean;
  seeking: boolean;
}

export interface ABMarkers {
  a: number | null;
  b: number | null;
}

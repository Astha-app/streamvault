export type Theme = 'dark' | 'light' | 'system';

export interface SubtitleStyle {
  fontSize: number;        // rem
  color: string;           // hex
  backgroundColor: string; // hex
  backgroundOpacity: number; // 0–1
  textShadow: boolean;
  position: 'bottom' | 'top';
}

export interface AppSettings {
  theme: Theme;
  defaultPlaybackRate: number;
  defaultVolume: number;
  defaultSubtitleLanguage: string;
  subtitleStyle: SubtitleStyle;
  defaultQuality: 'auto' | string;
  autoPlayNext: boolean;
  resumePlayback: boolean;
  saveHistory: boolean;
  keyboardShortcutsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultPlaybackRate: 1,
  defaultVolume: 1,
  defaultSubtitleLanguage: 'en',
  subtitleStyle: {
    fontSize: 1.1,
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.75,
    textShadow: true,
    position: 'bottom',
  },
  defaultQuality: 'auto',
  autoPlayNext: true,
  resumePlayback: true,
  saveHistory: true,
  keyboardShortcutsEnabled: true,
};

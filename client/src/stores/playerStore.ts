import { create } from 'zustand';
import type { VideoMetadata, SubtitleTrack } from '@shared/types/video';
import type { QualityLevel, PlaybackMode, ABMarkers } from '../types/player';

interface PlayerStore {
  // current media
  videoMeta: VideoMetadata | null;
  videoUrl: string | null;
  subtitleTracks: SubtitleTrack[];
  activeSubtitleId: string | null;
  qualityLevels: QualityLevel[];
  activeQuality: number;   // hls level index, -1 = auto
  audioTracks: { id: number; label: string; language: string }[];
  activeAudioTrack: number;

  // UI state (non-high-frequency — high-freq state lives in refs inside useVideoEngine)
  mode: PlaybackMode;
  showControls: boolean;
  showQueue: boolean;
  showSubtitleMenu: boolean;
  showQualityMenu: boolean;
  showAudioMenu: boolean;
  showSpeedMenu: boolean;
  abMarkers: ABMarkers;

  // setters
  setVideo: (meta: VideoMetadata, url: string) => void;
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void;
  setActiveSubtitle: (id: string | null) => void;
  setQualityLevels: (levels: QualityLevel[]) => void;
  setActiveQuality: (level: number) => void;
  setAudioTracks: (tracks: { id: number; label: string; language: string }[]) => void;
  setActiveAudioTrack: (id: number) => void;
  setMode: (mode: PlaybackMode) => void;
  setShowControls: (v: boolean) => void;
  toggleQueue: () => void;
  toggleSubtitleMenu: () => void;
  toggleQualityMenu: () => void;
  toggleAudioMenu: () => void;
  toggleSpeedMenu: () => void;
  setABMarkers: (markers: ABMarkers) => void;
  closeAllMenus: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  videoMeta: null,
  videoUrl: null,
  subtitleTracks: [],
  activeSubtitleId: null,
  qualityLevels: [],
  activeQuality: -1,
  audioTracks: [],
  activeAudioTrack: 0,
  mode: 'normal',
  showControls: true,
  showQueue: false,
  showSubtitleMenu: false,
  showQualityMenu: false,
  showAudioMenu: false,
  showSpeedMenu: false,
  abMarkers: { a: null, b: null },

  setVideo: (meta, url) => set({ videoMeta: meta, videoUrl: url }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setActiveSubtitle: (id) => set({ activeSubtitleId: id }),
  setQualityLevels: (levels) => set({ qualityLevels: levels }),
  setActiveQuality: (level) => set({ activeQuality: level }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setActiveAudioTrack: (id) => set({ activeAudioTrack: id }),
  setMode: (mode) => set({ mode }),
  setShowControls: (v) => set({ showControls: v }),
  toggleQueue: () => set((s) => ({ showQueue: !s.showQueue })),
  toggleSubtitleMenu: () => set((s) => ({ showSubtitleMenu: !s.showSubtitleMenu, showQualityMenu: false, showAudioMenu: false, showSpeedMenu: false })),
  toggleQualityMenu: () => set((s) => ({ showQualityMenu: !s.showQualityMenu, showSubtitleMenu: false, showAudioMenu: false, showSpeedMenu: false })),
  toggleAudioMenu: () => set((s) => ({ showAudioMenu: !s.showAudioMenu, showSubtitleMenu: false, showQualityMenu: false, showSpeedMenu: false })),
  toggleSpeedMenu: () => set((s) => ({ showSpeedMenu: !s.showSpeedMenu, showSubtitleMenu: false, showQualityMenu: false, showAudioMenu: false })),
  setABMarkers: (markers) => set({ abMarkers: markers }),
  closeAllMenus: () => set({ showSubtitleMenu: false, showQualityMenu: false, showAudioMenu: false, showSpeedMenu: false }),
  reset: () => set({
    videoMeta: null, videoUrl: null, subtitleTracks: [], activeSubtitleId: null,
    qualityLevels: [], activeQuality: -1, audioTracks: [], activeAudioTrack: 0,
    mode: 'normal', showControls: true, showQueue: false,
    showSubtitleMenu: false, showQualityMenu: false, showAudioMenu: false, showSpeedMenu: false,
    abMarkers: { a: null, b: null },
  }),
}));

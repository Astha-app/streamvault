import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoMetadata } from '@shared/types/video';

type RepeatMode = 'none' | 'one' | 'all';

interface QueueState {
  items: VideoMetadata[];
  currentIndex: number;
  repeat: RepeatMode;
  shuffle: boolean;
  shuffleOrder: number[];

  add: (video: VideoMetadata) => void;
  remove: (id: string) => void;
  reorder: (from: number, to: number) => void;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
  clear: () => void;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  current: () => VideoMetadata | null;
}

function buildShuffleOrder(length: number, current: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== current);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [current, ...rest];
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      items: [],
      currentIndex: 0,
      repeat: 'none',
      shuffle: false,
      shuffleOrder: [],

      add: (video) =>
        set((s) => {
          if (s.items.find((v) => v.id === video.id)) return s;
          return { items: [...s.items, video] };
        }),

      remove: (id) =>
        set((s) => {
          const idx = s.items.findIndex((v) => v.id === id);
          const items = s.items.filter((v) => v.id !== id);
          const currentIndex = idx < s.currentIndex ? s.currentIndex - 1 : Math.min(s.currentIndex, items.length - 1);
          return { items, currentIndex: Math.max(0, currentIndex) };
        }),

      reorder: (from, to) =>
        set((s) => {
          const items = [...s.items];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          return { items };
        }),

      setIndex: (index) => set({ currentIndex: index }),

      next: () =>
        set((s) => {
          const len = s.items.length;
          if (!len) return s;
          if (s.repeat === 'one') return s; // engine handles this
          if (s.shuffle && s.shuffleOrder.length) {
            const pos = s.shuffleOrder.indexOf(s.currentIndex);
            const nextPos = (pos + 1) % s.shuffleOrder.length;
            return { currentIndex: s.shuffleOrder[nextPos] };
          }
          const next = s.currentIndex + 1;
          if (next >= len) {
            return { currentIndex: s.repeat === 'all' ? 0 : s.currentIndex };
          }
          return { currentIndex: next };
        }),

      prev: () =>
        set((s) => {
          const prev = s.currentIndex - 1;
          return { currentIndex: Math.max(0, prev) };
        }),

      clear: () => set({ items: [], currentIndex: 0, shuffleOrder: [] }),

      setRepeat: (mode) => set({ repeat: mode }),

      toggleShuffle: () =>
        set((s) => {
          const shuffle = !s.shuffle;
          const shuffleOrder = shuffle ? buildShuffleOrder(s.items.length, s.currentIndex) : [];
          return { shuffle, shuffleOrder };
        }),

      current: () => {
        const s = get();
        return s.items[s.currentIndex] ?? null;
      },
    }),
    { name: 'queue-store' },
  ),
);

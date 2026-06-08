import { create } from 'zustand';
import { db } from '../services/cacheService';
import type { PlaybackState } from '@shared/types/video';

interface HistoryState {
  items: PlaybackState[];
  load: () => Promise<void>;
  upsert: (item: Omit<PlaybackState, 'lastWatched'> & { lastWatched?: string }) => Promise<void>;
  remove: (videoId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],

  load: async () => {
    const items = await db.history.orderBy('lastWatched').reverse().toArray();
    set({ items });
  },

  upsert: async (item) => {
    const now = new Date().toISOString();
    const existing = await db.history.get(item.videoId);
    const merged: PlaybackState = {
      ...item,
      lastWatched: now,
      rewatchCount: (existing?.rewatchCount ?? 0) + (item.completed && !existing?.completed ? 1 : 0),
      totalWatchTime: (existing?.totalWatchTime ?? 0) + (item.totalWatchTime ?? 0),
    };
    await db.history.put(merged);
    set((s) => {
      const filtered = s.items.filter((i) => i.videoId !== item.videoId);
      return { items: [merged, ...filtered] };
    });
  },

  remove: async (videoId) => {
    await db.history.delete(videoId);
    set((s) => ({ items: s.items.filter((i) => i.videoId !== videoId) }));
  },

  clear: async () => {
    await db.history.clear();
    set({ items: [] });
  },
}));

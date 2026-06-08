import React, { useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { loadSubtitleFile } from '../../services/subtitleService';

interface SubtitleMenuProps {
  onSelect: (id: string | null) => void;
  onAddTrack: (track: import('@shared/types/video').SubtitleTrack) => void;
}

export function SubtitleMenu({ onSelect, onAddTrack }: SubtitleMenuProps) {
  const { subtitleTracks, activeSubtitleId, showSubtitleMenu } = usePlayerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showSubtitleMenu) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const track = await loadSubtitleFile(file);
      onAddTrack(track);
      onSelect(track.id);
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  return (
    <div className="absolute bottom-20 right-3 bg-surface-100 border border-white/10 rounded-lg overflow-hidden shadow-xl z-50 min-w-[160px]">
      <div className="px-3 py-2 text-xs text-white/50 border-b border-white/10">Subtitles</div>
      <button
        className={`block w-full px-3 py-2 text-sm text-left hover:bg-white/10 ${!activeSubtitleId ? 'text-accent font-semibold' : 'text-white/80'}`}
        onClick={() => onSelect(null)}
      >
        Off
      </button>
      {subtitleTracks.map(t => (
        <button
          key={t.id}
          className={`block w-full px-3 py-2 text-sm text-left hover:bg-white/10 ${activeSubtitleId === t.id ? 'text-accent font-semibold' : 'text-white/80'}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
      <div className="border-t border-white/10">
        <button
          className="block w-full px-3 py-2 text-sm text-left text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
        >
          + Load .srt / .vtt file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt,.vtt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

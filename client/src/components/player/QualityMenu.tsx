import React from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface QualityMenuProps {
  onSelect: (level: number) => void;
}

export function QualityMenu({ onSelect }: QualityMenuProps) {
  const { qualityLevels, activeQuality, showQualityMenu } = usePlayerStore();

  if (!showQualityMenu || qualityLevels.length === 0) return null;

  return (
    <div className="absolute bottom-20 right-3 bg-surface-100 border border-white/10 rounded-lg overflow-hidden shadow-xl z-50 min-w-[120px]">
      <div className="px-3 py-2 text-xs text-white/50 border-b border-white/10">Quality</div>
      <button
        className={`block w-full px-3 py-2 text-sm text-left hover:bg-white/10 ${activeQuality === -1 ? 'text-accent font-semibold' : 'text-white/80'}`}
        onClick={() => onSelect(-1)}
      >
        Auto
      </button>
      {qualityLevels.map(level => (
        <button
          key={level.id}
          className={`block w-full px-3 py-2 text-sm text-left hover:bg-white/10 ${activeQuality === level.id ? 'text-accent font-semibold' : 'text-white/80'}`}
          onClick={() => onSelect(level.id)}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

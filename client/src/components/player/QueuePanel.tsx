import React from 'react';
import { useQueueStore } from '../../stores/queueStore';
import { formatTime } from '../../utils/time';

interface QueuePanelProps {
  onSelectIndex: (index: number) => void;
}

export function QueuePanel({ onSelectIndex }: QueuePanelProps) {
  const { items, currentIndex, remove, reorder, repeat, setRepeat, shuffle, toggleShuffle } = useQueueStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 p-6 gap-3">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
        <p className="text-sm">Queue is empty</p>
      </div>
    );
  }

  const nextRepeat = () => {
    const modes = ['none', 'all', 'one'] as const;
    const i = modes.indexOf(repeat);
    setRepeat(modes[(i + 1) % modes.length]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-white/80">Up Next ({items.length})</span>
        <div className="flex gap-2">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded text-xs ${shuffle ? 'text-accent' : 'text-white/50 hover:text-white'}`}
            title="Shuffle"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button
            onClick={nextRepeat}
            className={`p-1.5 rounded text-xs ${repeat !== 'none' ? 'text-accent' : 'text-white/50 hover:text-white'}`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 ${i === currentIndex ? 'bg-white/10' : ''}`}
            onClick={() => onSelectIndex(i)}
          >
            <span className={`text-xs w-4 text-right shrink-0 ${i === currentIndex ? 'text-accent' : 'text-white/30'}`}>
              {i === currentIndex ? '▶' : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${i === currentIndex ? 'text-white font-medium' : 'text-white/70'}`}>
                {item.title}
              </p>
              <p className="text-xs text-white/30 truncate">{item.host ?? ''}</p>
            </div>
            {item.duration && (
              <span className="text-xs text-white/40 shrink-0">{formatTime(item.duration)}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); remove(item.id); }}
              className="text-white/30 hover:text-white/80 transition-colors shrink-0"
              aria-label="Remove from queue"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

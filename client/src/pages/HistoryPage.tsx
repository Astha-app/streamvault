import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistoryStore } from '../stores/historyStore';
import { formatTime, formatRelativeDate } from '../utils/time';
import { EmptyState } from '../components/shared/EmptyState';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { items, load, remove, clear } = useHistoryStore();
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? items.filter(i => i.videoId.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clear();
    setConfirmClear(false);
    toast.success('History cleared');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20 sm:pb-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Watch History</h1>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className={`text-sm px-3 py-2 rounded-lg transition-colors ${confirmClear ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {confirmClear ? 'Confirm clear' : 'Clear all'}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search history…"
          className="w-full bg-surface-100 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent text-sm mb-6"
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
          title={search ? 'No results' : 'No watch history'}
          description={search ? 'Try a different search term.' : "Videos you watch will appear here."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.videoId} className="flex items-center gap-4 p-4 bg-surface-100 rounded-xl border border-white/10 group">
              {/* Progress ring */}
              <div className="relative w-10 h-10 shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
                  <circle
                    cx="18" cy="18" r="15" fill="none" stroke="#e50914" strokeWidth="3"
                    strokeDasharray={`${item.progress * 94.25} 94.25`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white/60">
                  {Math.round(item.progress * 100)}%
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.videoId}</p>
                <p className="text-white/40 text-xs">
                  {formatRelativeDate(item.lastWatched)} · {formatTime(item.currentTime)} / {formatTime(item.duration)}
                  {item.rewatchCount > 0 && ` · ${item.rewatchCount}× watched`}
                  {item.completed && ' · ✓ Completed'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/player/${item.videoId}?t=${Math.floor(item.currentTime)}`}
                  className="px-3 py-1.5 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Resume
                </Link>
                <button
                  onClick={async () => { await remove(item.videoId); toast('Removed from history'); }}
                  className="p-1.5 text-white/20 hover:text-white/60 transition-colors"
                  aria-label="Remove from history"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

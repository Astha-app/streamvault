import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../stores/historyStore';
import { useQueueStore } from '../stores/queueStore';
import { formatTime, formatRelativeDate } from '../utils/time';
import { EmptyState } from '../components/shared/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const { items, load } = useHistoryStore();
  const { items: queueItems, currentIndex } = useQueueStore();
  const [quickLink, setQuickLink] = useState('');

  useEffect(() => { load(); }, [load]);

  const inProgress = items.filter(i => i.progress > 0.02 && !i.completed).slice(0, 6);
  const recent = items.slice(0, 12);
  const currentQueueItem = queueItems[currentIndex];

  const handleQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickLink.trim()) {
      navigate(`/resolver?link=${encodeURIComponent(quickLink.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 sm:pb-8">
      {/* Hero / Quick link */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">StreamVault</h1>
        <p className="text-white/50 mb-6 text-sm">Paste a Real-Debrid supported link to stream instantly.</p>
        <form onSubmit={handleQuickLink} className="flex gap-3 max-w-2xl">
          <input
            type="url"
            value={quickLink}
            onChange={e => setQuickLink(e.target.value)}
            placeholder="Paste a supported link…"
            className="flex-1 bg-surface-100 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
          <button
            type="submit"
            disabled={!quickLink.trim()}
            className="px-5 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Resolve →
          </button>
        </form>
      </section>

      {/* Current queue */}
      {currentQueueItem && (
        <section className="mb-8">
          <h2 className="text-white/70 text-xs uppercase tracking-wider font-medium mb-3">Now Playing</h2>
          <Link
            to={`/player/${currentQueueItem.id}`}
            className="flex items-center gap-4 p-4 bg-surface-100 rounded-xl border border-white/10 hover:border-accent/50 transition-colors max-w-2xl"
          >
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{currentQueueItem.title}</p>
              <p className="text-white/40 text-xs">{currentQueueItem.host}</p>
            </div>
          </Link>
        </section>
      )}

      {/* Continue watching */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-white/70 text-xs uppercase tracking-wider font-medium mb-3">Continue Watching</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgress.map(item => (
              <Link
                key={item.videoId}
                to={`/player/${item.videoId}?t=${Math.floor(item.currentTime)}`}
                className="flex items-center gap-3 p-3 bg-surface-100 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.videoId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-white/10 rounded-full h-1">
                      <div className="bg-accent h-1 rounded-full" style={{ width: `${item.progress * 100}%` }} />
                    </div>
                    <span className="text-white/40 text-xs shrink-0">{formatTime(item.currentTime)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent videos */}
      {recent.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/70 text-xs uppercase tracking-wider font-medium">Recent</h2>
            <Link to="/history" className="text-xs text-white/40 hover:text-white transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {recent.map(item => (
              <Link
                key={item.videoId}
                to={`/player/${item.videoId}`}
                className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{item.videoId}</p>
                  <p className="text-white/30 text-xs">{formatRelativeDate(item.lastWatched)} · {Math.round(item.progress * 100)}% watched</p>
                </div>
                {item.completed && (
                  <span className="text-xs text-green-500/70 shrink-0">✓ Done</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          title="No videos yet"
          description="Paste a Real-Debrid link above or head to the Resolver to get started."
          action={<Link to="/resolver" className="px-4 py-2 bg-accent rounded-lg text-white text-sm hover:bg-accent-hover transition-colors">Go to Resolver</Link>}
        />
      )}
    </div>
  );
}

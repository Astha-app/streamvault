import React, { useEffect, useState } from 'react';
import { cacheApi } from '../services/apiClient';
import { clearAllAppData, getStorageEstimate, db } from '../services/cacheService';
import { formatBytes } from '../utils/time';
import { Spinner } from '../components/shared/Spinner';
import toast from 'react-hot-toast';

interface CacheStats {
  historyCount: number;
  metadataCount: number;
  subtitleCount: number;
  serverCachedLinks: number;
  storageUsage?: number;
  storageQuota?: number;
}

export default function CachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [historyCount, metadataCount, subtitleCount, storage] = await Promise.all([
        db.history.count(),
        db.metadata.count(),
        db.subtitles.count(),
        getStorageEstimate(),
      ]);
      let serverCachedLinks = 0;
      try {
        const cacheStatus = await cacheApi.status();
        serverCachedLinks = cacheStatus.resolvedLinks;
      } catch { /* server might not be running */ }

      setStats({
        historyCount,
        metadataCount,
        subtitleCount,
        serverCachedLinks,
        storageUsage: storage?.usage,
        storageQuota: storage?.quota,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleClearHistory = async () => {
    if (!confirm('Clear all watch history?')) return;
    await db.history.clear();
    toast.success('Watch history cleared');
    loadStats();
  };

  const handleClearMetadata = async () => {
    await db.metadata.clear();
    toast.success('Video metadata cache cleared');
    loadStats();
  };

  const handleClearSubtitles = async () => {
    await db.subtitles.clear();
    toast.success('Subtitle cache cleared');
    loadStats();
  };

  const handleClearServerCache = async () => {
    try {
      await cacheApi.clear();
      toast.success('Server Real-Debrid cache cleared');
      loadStats();
    } catch {
      toast.error('Could not reach server');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear ALL local app data? This includes history, metadata, settings, and subtitles.')) return;
    await clearAllAppData();
    try { await cacheApi.clear(); } catch { /* ignore */ }
    toast.success('All app data cleared');
    loadStats();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const usagePct = stats?.storageUsage && stats?.storageQuota
    ? (stats.storageUsage / stats.storageQuota) * 100
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20 sm:pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Cache & Storage</h1>

      {/* Storage bar */}
      {stats?.storageUsage !== undefined && stats?.storageQuota && (
        <div className="bg-surface-100 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Browser Storage Used</span>
            <span className="text-white/60 text-xs">{formatBytes(stats.storageUsage!)} / {formatBytes(stats.storageQuota)}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${Math.min(usagePct ?? 0, 100)}%` }} />
          </div>
          <p className="text-white/30 text-xs mt-1">{usagePct?.toFixed(1)}% used</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'History entries', value: stats?.historyCount ?? 0 },
          { label: 'Cached metadata', value: stats?.metadataCount ?? 0 },
          { label: 'Cached subtitles', value: stats?.subtitleCount ?? 0 },
          { label: 'Server resolved links', value: stats?.serverCachedLinks ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-surface-100 rounded-xl border border-white/10 p-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/10">
        {[
          { label: 'Clear watch history', desc: 'Removes playback positions and progress', action: handleClearHistory },
          { label: 'Clear video metadata', desc: 'Removes cached video info', action: handleClearMetadata },
          { label: 'Clear subtitle cache', desc: 'Removes stored subtitle files', action: handleClearSubtitles },
          { label: 'Clear server RD cache', desc: 'Forces re-resolution of cached links', action: handleClearServerCache },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-white/80 text-sm">{item.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={item.action}
              className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        ))}
      </div>

      {/* Nuclear option */}
      <button
        onClick={handleClearAll}
        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
      >
        Clear all app data
      </button>

      <p className="text-white/20 text-xs text-center">
        Note: Video files are never cached locally by this app. Only metadata, settings, and subtitle text are stored.
      </p>
    </div>
  );
}

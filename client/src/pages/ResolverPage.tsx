import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { realDebridApi } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import { useQueueStore } from '../stores/queueStore';
import { db } from '../services/cacheService';
import { formatFileSize } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { nanoid } from '../utils/nanoid';
import { Spinner } from '../components/shared/Spinner';
import type { UnrestrictResult } from '@shared/types/api';
import type { VideoMetadata } from '@shared/types/video';
import toast from 'react-hot-toast';

export default function ResolverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, connected, setUser, clearUser } = useAuthStore();
  const { add: addToQueue } = useQueueStore();

  const [link, setLink] = useState(searchParams.get('link') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [result, setResult] = useState<UnrestrictResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-resolve if link came from query param
  useEffect(() => {
    const prelink = searchParams.get('link');
    if (prelink) handleResolve(prelink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setError(null);
    try {
      const userData = await realDebridApi.test();
      setUser(userData);
      toast.success(`Connected as ${userData.username}`);
    } catch (err) {
      setError(getErrorMessage(err));
      clearUser();
    } finally {
      setTestingConn(false);
    }
  };

  const handleResolve = async (linkOverride?: string) => {
    const target = (linkOverride || link).trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await realDebridApi.unrestrict(target, password || undefined);
      setResult(res);

      // Cache metadata in IndexedDB
      const meta: VideoMetadata = {
        id: res.id || nanoid(),
        title: res.filename,
        filename: res.filename,
        filesize: res.filesize,
        mimeType: res.mimeType,
        host: res.host,
        host_icon: res.host_icon,
        resolvedUrl: res.download,
        originalLink: target,
        addedAt: new Date().toISOString(),
      };
      await db.metadata.put(meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!result) return;
    const meta: VideoMetadata = {
      id: result.id || nanoid(),
      title: result.filename,
      filename: result.filename,
      filesize: result.filesize,
      mimeType: result.mimeType,
      host: result.host,
      resolvedUrl: result.download,
      originalLink: link,
      addedAt: new Date().toISOString(),
    };
    addToQueue(meta);
    navigate(`/player/${meta.id}?url=${encodeURIComponent(result.download)}&title=${encodeURIComponent(result.filename)}`);
  };

  const handleAddToQueue = () => {
    if (!result) return;
    const meta: VideoMetadata = {
      id: result.id || nanoid(),
      title: result.filename,
      filename: result.filename,
      filesize: result.filesize,
      mimeType: result.mimeType,
      host: result.host,
      resolvedUrl: result.download,
      originalLink: link,
      addedAt: new Date().toISOString(),
    };
    addToQueue(meta);
    toast.success('Added to queue');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20 sm:pb-8">
      <h1 className="text-2xl font-bold text-white mb-1">Resolver</h1>
      <p className="text-white/40 text-sm mb-8">Paste a Real-Debrid supported link to generate a playable stream.</p>

      {/* Connection status */}
      <div className="bg-surface-100 rounded-xl border border-white/10 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Real-Debrid Connection</p>
            {connected && user ? (
              <p className="text-green-400 text-xs">✓ Connected as <span className="font-medium">{user.username}</span> · {user.type}</p>
            ) : (
              <p className="text-white/40 text-xs">Not connected — make sure your API token is set in server/.env</p>
            )}
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testingConn}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-sm transition-colors disabled:opacity-50"
          >
            {testingConn ? <Spinner size="sm" /> : null}
            Test
          </button>
        </div>

        {!connected && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs">
              1. Get your API token at <span className="text-accent">real-debrid.com/apitoken</span><br />
              2. Add it to <code className="bg-black/40 px-1 rounded text-xs">server/.env</code> as <code className="bg-black/40 px-1 rounded text-xs">REALDEBRID_API_TOKEN=…</code><br />
              3. Restart the server and click Test above.
            </p>
          </div>
        )}
      </div>

      {/* Link input */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Supported Link</label>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://…"
            className="w-full bg-surface-100 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            onKeyDown={e => e.key === 'Enter' && handleResolve()}
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Password (optional)</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Leave blank if none"
            className="w-full bg-surface-100 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>
        <button
          onClick={() => handleResolve()}
          disabled={loading || !link.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg font-medium text-sm transition-colors"
        >
          {loading ? <><Spinner size="sm" /> Resolving…</> : 'Resolve Link'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-surface-100 rounded-xl border border-white/10 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-white/10">
            <p className="text-white font-medium truncate">{result.filename}</p>
            <p className="text-white/40 text-xs mt-1">{result.host} · {formatFileSize(result.filesize)} · {result.mimeType || 'unknown type'}</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-xs border-b border-white/10">
            <div>
              <span className="text-white/40">Streamable</span>
              <p className="text-white mt-0.5">{result.streamable === 1 ? '✓ Yes' : '✗ No'}</p>
            </div>
            <div>
              <span className="text-white/40">Chunks</span>
              <p className="text-white mt-0.5">{result.chunks}</p>
            </div>
            <div>
              <span className="text-white/40">Resolved at</span>
              <p className="text-white mt-0.5">{new Date(result.resolvedAt).toLocaleTimeString()}</p>
            </div>
            <div>
              <span className="text-white/40">Cache expires</span>
              <p className="text-white mt-0.5">{new Date(result.expiresAt).toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <button
              onClick={handlePlay}
              className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-sm transition-colors"
            >
              ▶ Play Now
            </button>
            <button
              onClick={handleAddToQueue}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg text-sm transition-colors"
            >
              + Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

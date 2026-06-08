import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { useQueueStore } from '../stores/queueStore';
import { useHistoryStore } from '../stores/historyStore';
import { db } from '../services/cacheService';
import { Spinner } from '../components/shared/Spinner';
import type { VideoMetadata } from '@shared/types/video';
import { nanoid } from '../utils/nanoid';

export default function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { items: queueItems, currentIndex, setIndex } = useQueueStore();
  const { load: loadHistory } = useHistoryStore();

  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadHistory();
    resolveVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const resolveVideo = async () => {
    // 1. Try URL param (direct from resolver page)
    const directUrl = searchParams.get('url');
    const directTitle = searchParams.get('title');

    if (directUrl && directTitle) {
      const m: VideoMetadata = {
        id: videoId || nanoid(),
        title: decodeURIComponent(directTitle),
        filename: decodeURIComponent(directTitle),
        resolvedUrl: decodeURIComponent(directUrl),
        addedAt: new Date().toISOString(),
      };
      setMeta(m);
      setUrl(decodeURIComponent(directUrl));
      return;
    }

    // 2. Try queue
    const queueItem = queueItems.find(v => v.id === videoId);
    if (queueItem?.resolvedUrl) {
      setMeta(queueItem);
      setUrl(queueItem.resolvedUrl);
      const idx = queueItems.indexOf(queueItem);
      if (idx !== currentIndex) setIndex(idx);
      return;
    }

    // 3. Try IndexedDB metadata
    if (videoId) {
      const stored = await db.metadata.get(videoId);
      if (stored?.resolvedUrl) {
        setMeta(stored);
        setUrl(stored.resolvedUrl);
        return;
      }
    }

    setNotFound(true);
  };

  const handleEnded = () => {
    // Auto-advance queue handled inside VideoPlayer via settings.autoPlayNext
    // This callback handles final navigation if queue is exhausted
    navigate('/');
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/60">Video not found or link has expired.</p>
        <button onClick={() => navigate('/resolver')} className="px-4 py-2 bg-accent rounded-lg text-white text-sm">
          Go to Resolver
        </button>
      </div>
    );
  }

  if (!meta || !url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <VideoPlayer meta={meta} url={url} onEnded={handleEnded} />
    </div>
  );
}

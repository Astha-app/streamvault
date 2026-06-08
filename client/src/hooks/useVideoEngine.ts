import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import Hls from 'hls.js';
import { detectStreamType } from '../utils/url';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import type { VideoMetadata } from '@shared/types/video';

const PROGRESS_SAVE_INTERVAL_MS = 5_000;
const STALL_TIMEOUT_MS = 8_000;

export interface VideoEngineRefs {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  hlsRef: MutableRefObject<Hls | null>;
  currentTimeRef: MutableRefObject<number>;
  durationRef: MutableRefObject<number>;
  playingRef: MutableRefObject<boolean>;
  bufferingRef: MutableRefObject<boolean>;
  volumeRef: MutableRefObject<number>;
}

export function useVideoEngine(
  meta: VideoMetadata | null,
  url: string | null,
  onTimeUpdate?: (currentTime: number, duration: number) => void,
  onEnded?: () => void,
  onError?: (msg: string) => void,
): VideoEngineRefs {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const playingRef = useRef(false);
  const bufferingRef = useRef(false);
  const volumeRef = useRef(1);
  const rafRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimeRef = useRef(0);

  const { setQualityLevels, setActiveQuality } = usePlayerStore();
  const { settings } = useSettingsStore();
  const { upsert: upsertHistory } = useHistoryStore();

  // ── RAF loop: updates time refs without triggering React re-renders ──────────
  const startRaf = useCallback(() => {
    const tick = () => {
      const vid = videoRef.current;
      if (vid) {
        currentTimeRef.current = vid.currentTime;
        durationRef.current = vid.duration || 0;
        onTimeUpdate?.(currentTimeRef.current, durationRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onTimeUpdate]);

  const stopRaf = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  // ── Periodic progress save ───────────────────────────────────────────────────
  const saveProgress = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !meta || !settings.saveHistory) return;
    const elapsed = Date.now() / 1000 - sessionStartTimeRef.current;
    upsertHistory({
      videoId: meta.id,
      url: url || '',
      currentTime: vid.currentTime,
      duration: vid.duration || 0,
      progress: vid.duration ? vid.currentTime / vid.duration : 0,
      completed: vid.duration > 0 && vid.currentTime / vid.duration >= 0.95,
      rewatchCount: 0,
      totalWatchTime: Math.max(0, elapsed),
    });
    sessionStartTimeRef.current = Date.now() / 1000;
  }, [meta, url, settings.saveHistory, upsertHistory]);

  // ── Destroy HLS instance cleanly ─────────────────────────────────────────────
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // ── Load source ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !url) return;

    destroyHls();
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    sessionStartTimeRef.current = Date.now() / 1000;

    const streamType = detectStreamType(url, meta?.mimeType);

    if (streamType === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(vid);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        const levels = data.levels.map((l, i) => ({
          id: i,
          label: l.height ? `${l.height}p` : `Level ${i}`,
          height: l.height,
          bitrate: l.bitrate,
        }));
        setQualityLevels(levels);
        setActiveQuality(-1); // auto

        if (settings.resumePlayback) {
          // Resume position handled externally via historyStore
        }
        vid.play().catch(() => {/* autoplay blocked — user interaction needed */});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setActiveQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // attempt recovery
              onError?.('Network error while loading stream. Retrying…');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              destroyHls();
              onError?.('Unrecoverable stream error. Please try again.');
          }
        }
      });
    } else if (streamType === 'hls' && vid.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      vid.src = url;
      vid.play().catch(() => {});
    } else {
      // Direct MP4/WebM/etc.
      vid.src = url;
      vid.play().catch(() => {});
    }

    // Restore volume
    vid.volume = settings.defaultVolume;
    vid.playbackRate = settings.defaultPlaybackRate;
    volumeRef.current = settings.defaultVolume;

    startRaf();
    saveTimerRef.current = setInterval(saveProgress, PROGRESS_SAVE_INTERVAL_MS);

    return () => {
      stopRaf();
      destroyHls();
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      saveProgress(); // save on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── Stall detection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onWaiting = () => {
      bufferingRef.current = true;
      stallTimerRef.current = setTimeout(() => {
        if (bufferingRef.current) onError?.('Playback stalled. Check your connection.');
      }, STALL_TIMEOUT_MS);
    };
    const onPlaying = () => {
      bufferingRef.current = false;
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
    const onPlay = () => { playingRef.current = true; };
    const onPause = () => { playingRef.current = false; };

    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('playing', onPlaying);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('ended', onEnded ?? (() => {}));

    return () => {
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('playing', onPlaying);
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('ended', onEnded ?? (() => {}));
    };
  }, [onEnded, onError]);

  return { videoRef, hlsRef, currentTimeRef, durationRef, playingRef, bufferingRef, volumeRef };
}

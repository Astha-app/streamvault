import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoEngine } from '../../hooks/useVideoEngine';
import { useKeyboardShortcuts, PLAYBACK_SPEEDS } from '../../hooks/useKeyboardShortcuts';
import { usePlayerGestures } from '../../hooks/usePlayerGestures';
import { useMediaSession } from '../../hooks/useMediaSession';
import { usePlayerStore } from '../../stores/playerStore';
import { useQueueStore } from '../../stores/queueStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { PlayerControls } from './PlayerControls';
import { QualityMenu } from './QualityMenu';
import { SubtitleMenu } from './SubtitleMenu';
import { QueuePanel } from './QueuePanel';
import type { VideoMetadata, SubtitleTrack } from '@shared/types/video';
import { clamp } from '../../utils/format';
import toast from 'react-hot-toast';

const CONTROLS_HIDE_DELAY = 3000;

interface VideoPlayerProps {
  meta: VideoMetadata;
  url: string;
  onEnded?: () => void;
}

export function VideoPlayer({ meta, url, onEnded }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loop, setLoop] = useState(false);
  const [captionsActive, setCaptionsActive] = useState(false);

  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    mode, showControls, showQueue,
    setMode, setShowControls, toggleQueue, setVideo,
    setSubtitleTracks, setActiveSubtitle, activeSubtitleId,
    subtitleTracks, qualityLevels, activeQuality,
  } = usePlayerStore();

  const { items: queueItems, currentIndex, next, prev, setIndex } = useQueueStore();
  const { settings } = useSettingsStore();

  // ── Video engine ─────────────────────────────────────────────────────────────
  const { videoRef, hlsRef, currentTimeRef, durationRef, playingRef, bufferingRef } = useVideoEngine(
    meta,
    url,
    (_ct, _d) => {
      // Intentionally empty — buffered ranges are polled below at ~2Hz
    },
    () => {
      if (settings.autoPlayNext) handleNext();
      else onEnded?.();
    },
    (msg) => setError(msg),
  );

  // Poll buffered ranges at ~2Hz instead of every RAF frame to avoid 60x/sec setState
  useEffect(() => {
    const id = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.buffered.length === 0) return;
      setBuffered(vid.buffered);
    }, 500);
    return () => clearInterval(id);
  }, [videoRef]);

  // Sync video element events → local state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onVolumeChange = () => { setVolume(vid.volume); setMuted(vid.muted); };
    const onRateChange = () => setPlaybackRate(vid.playbackRate);
    const onError = () => setError('Playback error. The file may be unsupported or unavailable.');

    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('canplay', onCanPlay);
    vid.addEventListener('volumechange', onVolumeChange);
    vid.addEventListener('ratechange', onRateChange);
    vid.addEventListener('error', onError);
    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('canplay', onCanPlay);
      vid.removeEventListener('volumechange', onVolumeChange);
      vid.removeEventListener('ratechange', onRateChange);
      vid.removeEventListener('error', onError);
    };
  }, [videoRef]);

  useEffect(() => {
    setVideo(meta, url);
  }, [meta, url, setVideo]);

  // ── Controls auto-hide ───────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (mode === 'fullscreen' || mode === 'theater') {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), CONTROLS_HIDE_DELAY);
    }
  }, [mode, setShowControls]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [playing, resetControlsTimer]);

  // ── Playback actions ─────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => {});
    else vid.pause();
  }, [videoRef]);

  const seekBy = useCallback((delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = clamp(vid.currentTime + delta, 0, vid.duration || 0);
  }, [videoRef]);

  const seekTo = useCallback((time: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = clamp(time, 0, vid.duration || 0);
  }, [videoRef]);

  const handleVolumeChange = useCallback((v: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = clamp(v, 0, 1);
    vid.muted = false;
  }, [videoRef]);

  const handleToggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = !vid.muted;
  }, [videoRef]);

  const handleSpeedChange = useCallback((rate: number) => {
    const vid = videoRef.current;
    if (vid) vid.playbackRate = rate;
  }, [videoRef]);

  const handleToggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setMode('fullscreen');
    } else {
      await document.exitFullscreen();
      setMode('normal');
    }
  }, [setMode]);

  const handleToggleTheater = useCallback(() => {
    setMode(mode === 'theater' ? 'normal' : 'theater');
  }, [mode, setMode]);

  const handleTogglePip = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await vid.requestPictureInPicture();
    } else {
      toast.error('Picture-in-Picture is not supported in this browser.');
    }
  }, [videoRef]);

  const handleToggleCaptions = useCallback(() => {
    if (!subtitleTracks.length) return;
    if (captionsActive) {
      setCaptionsActive(false);
      setActiveSubtitle(null);
    } else {
      setCaptionsActive(true);
      setActiveSubtitle(subtitleTracks[0].id);
    }
  }, [captionsActive, subtitleTracks, setActiveSubtitle]);

  const adjustSpeed = useCallback((delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const i = PLAYBACK_SPEEDS.indexOf(vid.playbackRate);
    const next = PLAYBACK_SPEEDS[clamp(i + delta, 0, PLAYBACK_SPEEDS.length - 1)];
    vid.playbackRate = next;
  }, [videoRef]);

  const handleNext = useCallback(() => {
    next();
  }, [next]);

  const handlePrev = useCallback(() => {
    const vid = videoRef.current;
    // If more than 3s in, restart; otherwise go to prev
    if (vid && vid.currentTime > 3) {
      vid.currentTime = 0;
    } else {
      prev();
    }
  }, [videoRef, prev]);

  const handleQualitySelect = useCallback((level: number) => {
    const hls = hlsRef.current;
    if (hls) hls.currentLevel = level;
  }, [hlsRef]);

  const handleAddSubtitle = useCallback((track: SubtitleTrack) => {
    setSubtitleTracks([...subtitleTracks, track]);
  }, [subtitleTracks, setSubtitleTracks]);

  // ── Subtitle rendering (via <track> elements) ────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    for (let i = 0; i < vid.textTracks.length; i++) {
      const tt = vid.textTracks[i];
      const track = subtitleTracks.find(t => t.id === tt.id || t.label === tt.label);
      tt.mode = (track && track.id === activeSubtitleId) ? 'showing' : 'hidden';
    }
  }, [activeSubtitleId, subtitleTracks, videoRef]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useKeyboardShortcuts({
    togglePlay,
    seekBy,
    adjustVolume: (d) => handleVolumeChange(clamp((videoRef.current?.volume ?? 1) + d, 0, 1)),
    toggleMute: handleToggleMute,
    toggleFullscreen: handleToggleFullscreen,
    toggleTheater: handleToggleTheater,
    togglePip: handleTogglePip,
    toggleCaptions: handleToggleCaptions,
    adjustSpeed,
    seekToPercent: (pct) => seekTo(((durationRef.current || 0) * pct) / 100),
    frameStep: (fwd) => seekBy(fwd ? 1 / 30 : -1 / 30),
  });

  // ── Media Session ────────────────────────────────────────────────────────────
  useMediaSession({
    meta,
    playing,
    onPlay: () => videoRef.current?.play(),
    onPause: () => videoRef.current?.pause(),
    onSeekForward: () => seekBy(10),
    onSeekBackward: () => seekBy(-10),
    onNext: handleNext,
    onPrev: handlePrev,
    getCurrentTime: () => currentTimeRef.current,
    getDuration: () => durationRef.current,
  });

  // ── Gestures ─────────────────────────────────────────────────────────────────
  const { onTouchStart, onTouchMove, onTouchEnd } = usePlayerGestures({
    containerRef,
    onDoubleTapLeft: () => { seekBy(-10); toast('⏪ -10s', { duration: 800, id: 'seek' }); },
    onDoubleTapRight: () => { seekBy(10); toast('⏩ +10s', { duration: 800, id: 'seek' }); },
    onTap: () => setShowControls(!showControls),
    onSwipeHorizontal: (dx, w) => seekBy((dx / w) * (durationRef.current || 0) * 0.5),
    onSwipeVerticalRight: (dy) => handleVolumeChange(clamp((videoRef.current?.volume ?? 1) - dy / 300, 0, 1)),
    onSwipeEnd: () => {},
  });

  return (
    <div
      ref={containerRef}
      className={`relative bg-black select-none ${mode === 'fullscreen' ? 'w-screen h-screen' : mode === 'theater' ? 'w-full aspect-video max-h-[80vh]' : 'w-full aspect-video'}`}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => mode === 'fullscreen' && setShowControls(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        loop={loop}
        onClick={togglePlay}
      >
        {subtitleTracks.map(t => (
          <track key={t.id} id={t.id} kind="subtitles" label={t.label} srcLang={t.language} src={t.src} />
        ))}
      </video>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-16 h-16 animate-spin text-white/60" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-6">
          <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <p className="text-white text-center text-sm max-w-xs">{error}</p>
          <button
            className="px-4 py-2 bg-accent rounded-lg text-white text-sm hover:bg-accent-hover transition-colors"
            onClick={() => { setError(null); setLoading(true); if (videoRef.current) videoRef.current.load(); }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 ${showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Title bar */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <p className="text-white font-medium text-sm truncate">{meta.title}</p>
          {meta.host && <p className="text-white/50 text-xs">{meta.host}</p>}
        </div>

        {/* Player controls */}
        <PlayerControls
          currentTimeRef={currentTimeRef}
          durationRef={durationRef}
          progressRef={progressRef}
          playing={playing}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          buffered={buffered}
          loading={loading}
          loop={loop}
          hasQueue={queueItems.length > 1}
          hasNext={currentIndex < queueItems.length - 1}
          hasPrev={currentIndex > 0}
          onPlayPause={togglePlay}
          onSeek={seekTo}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onSpeedChange={handleSpeedChange}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleTheater={handleToggleTheater}
          onTogglePip={handleTogglePip}
          onToggleLoop={() => setLoop(l => !l)}
          onNext={handleNext}
          onPrev={handlePrev}
          onToggleQueue={toggleQueue}
          onToggleCaptions={handleToggleCaptions}
          hasSubtitles={subtitleTracks.length > 0}
          captionsActive={captionsActive}
        />

        {/* Menus */}
        <QualityMenu onSelect={handleQualitySelect} />
        <SubtitleMenu onSelect={setActiveSubtitle} onAddTrack={handleAddSubtitle} />
      </div>

      {/* Queue sidebar */}
      {showQueue && (
        <div className="absolute top-0 right-0 bottom-0 w-72 bg-surface-50/95 backdrop-blur-sm border-l border-white/10 z-40 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-medium">Queue</span>
            <button onClick={toggleQueue} className="text-white/50 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <QueuePanel onSelectIndex={setIndex} />
        </div>
      )}
    </div>
  );
}

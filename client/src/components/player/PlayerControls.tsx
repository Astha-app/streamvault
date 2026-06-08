import React, { useCallback, useState, useRef, MutableRefObject } from 'react';
import { SeekBar } from './SeekBar';
import { VolumeControl } from './VolumeControl';
import { formatTime } from '../../utils/time';
import { PLAYBACK_SPEEDS } from '../../hooks/useKeyboardShortcuts';
import { usePlayerStore } from '../../stores/playerStore';

interface PlayerControlsProps {
  currentTimeRef: MutableRefObject<number>;
  durationRef: MutableRefObject<number>;
  progressRef: MutableRefObject<number>;
  playing: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: TimeRanges | null;
  loading: boolean;
  loop: boolean;
  hasQueue: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onToggleTheater: () => void;
  onTogglePip: () => void;
  onToggleLoop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleQueue: () => void;
  onToggleCaptions: () => void;
  hasSubtitles: boolean;
  captionsActive: boolean;
}

export const PlayerControls = React.memo(function PlayerControls(props: PlayerControlsProps) {
  const {
    currentTimeRef, durationRef, progressRef, playing, volume, muted, playbackRate, buffered,
    loading, loop, hasNext, hasPrev, onPlayPause, onSeek, onVolumeChange, onToggleMute,
    onSpeedChange, onToggleFullscreen, onToggleTheater, onTogglePip, onToggleLoop,
    onNext, onPrev, onToggleQueue, onToggleCaptions, hasSubtitles, captionsActive,
  } = props;

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const { toggleSubtitleMenu, toggleQualityMenu } = usePlayerStore();

  // Display time — uses a ref-driven span to avoid full re-render on every tick
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    let rafId: number;
    const update = () => {
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent =
          `${formatTime(currentTimeRef.current)} / ${formatTime(durationRef.current)}`;
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [currentTimeRef, durationRef]);

  return (
    <div className="flex flex-col gap-2 px-3 pb-3 pt-1 w-full">
      {/* Seek bar */}
      <SeekBar
        currentTimeRef={currentTimeRef}
        durationRef={durationRef}
        buffered={buffered}
        onSeek={onSeek}
        progressRef={progressRef}
      />

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left controls */}
        <div className="flex items-center gap-1">
          {/* Prev */}
          <ControlBtn aria-label="Previous" onClick={onPrev} disabled={!hasPrev}>
            <SkipPrevIcon />
          </ControlBtn>

          {/* Play/Pause */}
          <ControlBtn aria-label={playing ? 'Pause' : 'Play'} onClick={onPlayPause} large>
            {loading ? <SpinnerIcon /> : playing ? <PauseIcon /> : <PlayIcon />}
          </ControlBtn>

          {/* Next */}
          <ControlBtn aria-label="Next" onClick={onNext} disabled={!hasNext}>
            <SkipNextIcon />
          </ControlBtn>

          {/* Volume */}
          <VolumeControl volume={volume} muted={muted} onChange={onVolumeChange} onToggleMute={onToggleMute} />

          {/* Time */}
          <span ref={timeDisplayRef} className="text-white/80 text-sm font-mono select-none ml-1">
            {formatTime(currentTimeRef.current)} / {formatTime(durationRef.current)}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Loop */}
          <ControlBtn aria-label="Loop" onClick={onToggleLoop} active={loop}>
            <LoopIcon />
          </ControlBtn>

          {/* Captions */}
          {hasSubtitles && (
            <ControlBtn aria-label="Subtitles" onClick={onToggleCaptions} active={captionsActive}>
              <CcIcon />
            </ControlBtn>
          )}

          {/* Speed */}
          <div className="relative">
            <ControlBtn aria-label="Speed" onClick={() => setShowSpeedMenu(v => !v)}>
              <span className="text-xs font-medium">{playbackRate}x</span>
            </ControlBtn>
            {showSpeedMenu && (
              <div className="absolute bottom-10 right-0 bg-surface-100 border border-white/10 rounded-lg overflow-hidden shadow-xl z-50 min-w-[80px]">
                {PLAYBACK_SPEEDS.map(s => (
                  <button
                    key={s}
                    className={`block w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${s === playbackRate ? 'text-accent font-semibold' : 'text-white/80'}`}
                    onClick={() => { onSpeedChange(s); setShowSpeedMenu(false); }}
                  >
                    {s === 1 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality */}
          <ControlBtn aria-label="Quality" onClick={toggleQualityMenu}>
            <SettingsIcon />
          </ControlBtn>

          {/* Queue */}
          <ControlBtn aria-label="Queue" onClick={onToggleQueue}>
            <QueueIcon />
          </ControlBtn>

          {/* PiP */}
          <ControlBtn aria-label="Picture in Picture" onClick={onTogglePip}>
            <PipIcon />
          </ControlBtn>

          {/* Theater */}
          <ControlBtn aria-label="Theater mode" onClick={onToggleTheater}>
            <TheaterIcon />
          </ControlBtn>

          {/* Fullscreen */}
          <ControlBtn aria-label="Fullscreen" onClick={onToggleFullscreen}>
            <FullscreenIcon />
          </ControlBtn>
        </div>
      </div>
    </div>
  );
});

// ── Small components ─────────────────────────────────────────────────────────

function ControlBtn({ children, onClick, disabled, active, large, 'aria-label': label }:
  { children: React.ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean; large?: boolean; 'aria-label'?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        flex items-center justify-center rounded transition-colors
        ${large ? 'w-10 h-10' : 'w-8 h-8'}
        ${active ? 'text-accent' : 'text-white/80 hover:text-white'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:ring-2 focus-visible:ring-accent outline-none
      `}
    >
      {children}
    </button>
  );
}

// Icons as inline SVGs to keep bundle lean
const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const SkipPrevIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const SkipNextIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>;
const FullscreenIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const TheaterIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/></svg>;
const PipIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>;
const LoopIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>;
const CcIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/></svg>;
const SettingsIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>;
const QueueIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>;
const SpinnerIcon = () => <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>;

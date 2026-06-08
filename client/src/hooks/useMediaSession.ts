import { useEffect } from 'react';
import type { VideoMetadata } from '@shared/types/video';

interface MediaSessionOptions {
  meta: VideoMetadata | null;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export function useMediaSession({
  meta,
  playing,
  onPlay,
  onPause,
  onSeekForward,
  onSeekBackward,
  onNext,
  onPrev,
  getCurrentTime,
  getDuration,
}: MediaSessionOptions) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !meta) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.host ?? 'StreamVault',
      album: '',
      artwork: meta.thumbnail
        ? [{ src: meta.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', onPlay);
    navigator.mediaSession.setActionHandler('pause', onPause);
    navigator.mediaSession.setActionHandler('seekforward', onSeekForward);
    navigator.mediaSession.setActionHandler('seekbackward', onSeekBackward);
    if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
    if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [meta, onPlay, onPause, onSeekForward, onSeekBackward, onNext, onPrev]);

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    try {
      navigator.mediaSession.setPositionState({
        duration: getDuration(),
        position: getCurrentTime(),
        playbackRate: 1,
      });
    } catch {
      // setPositionState can throw if duration is invalid
    }
  }, [playing, getCurrentTime, getDuration]);
}

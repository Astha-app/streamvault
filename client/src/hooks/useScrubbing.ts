import { useRef, useCallback, MutableRefObject } from 'react';

/**
 * High-performance seek-bar scrubbing using pointer events + requestAnimationFrame.
 *
 * Key design decisions:
 *  - Pointer events (not mouse/touch) for unified handling
 *  - RAF for smooth visual update during drag — does NOT set video.currentTime every frame
 *  - video.currentTime is only committed on pointerup (final seek) or at a throttled interval
 *  - This prevents video decoder thrashing on fast scrubs of large files
 */

interface ScrubOptions {
  duration: MutableRefObject<number>;
  onScrubChange: (progress: number) => void; // visual update only (0–1)
  onScrubCommit: (time: number) => void;     // actual seek
}

export interface ScrubState {
  isDragging: boolean;
  dragProgress: number; // 0–1
}

export function useScrubbing({ duration, onScrubChange, onScrubCommit }: ScrubOptions) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const pendingProgressRef = useRef(0);
  const scrubStateRef = useRef<ScrubState>({ isDragging: false, dragProgress: 0 });

  const getProgress = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const progress = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, progress));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    scrubStateRef.current.isDragging = true;

    const progress = getProgress(e.clientX);
    pendingProgressRef.current = progress;
    scrubStateRef.current.dragProgress = progress;
    onScrubChange(progress);
  }, [getProgress, onScrubChange]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const progress = getProgress(e.clientX);
    pendingProgressRef.current = progress;

    // Schedule visual update via RAF — no React state update here
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      scrubStateRef.current.dragProgress = pendingProgressRef.current;
      onScrubChange(pendingProgressRef.current);
    });
  }, [getProgress, onScrubChange]);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    scrubStateRef.current.isDragging = false;
    cancelAnimationFrame(rafRef.current);

    const finalProgress = pendingProgressRef.current;
    const finalTime = finalProgress * (duration.current || 0);
    onScrubCommit(finalTime);
  }, [duration, onScrubCommit]);

  return { trackRef, onPointerDown, onPointerMove, onPointerUp, scrubStateRef };
}

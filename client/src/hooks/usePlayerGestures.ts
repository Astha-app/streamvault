import { useRef, useCallback, MutableRefObject } from 'react';

/**
 * Mobile/touch gesture handler for the video player.
 * - Double-tap left/right → seek ±10s
 * - Swipe horizontal → scrub
 * - Swipe vertical (right side) → volume
 * - Single tap → toggle controls
 */

interface GestureOptions {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onTap: () => void;
  onSwipeHorizontal: (deltaX: number, containerWidth: number) => void;
  onSwipeVerticalRight: (deltaY: number) => void;
  onSwipeEnd: () => void;
}

const DOUBLE_TAP_DELAY = 250;
const SWIPE_THRESHOLD = 10;

export function usePlayerGestures({
  onDoubleTapLeft,
  onDoubleTapRight,
  onTap,
  onSwipeHorizontal,
  onSwipeVerticalRight,
  onSwipeEnd,
}: GestureOptions) {
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; side: 'left' | 'right' } | null>(null);
  const isSwiping = useRef(false);
  const swipeDir = useRef<'h' | 'v' | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const side = touch.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, side };
    isSwiping.current = false;
    swipeDir.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

    if (!swipeDir.current) {
      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        swipeDir.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        isSwiping.current = true;
      }
    }

    if (swipeDir.current === 'h') {
      e.preventDefault(); // prevent scroll
      onSwipeHorizontal(dx, rect.width);
    } else if (swipeDir.current === 'v' && touchStartRef.current.side === 'right') {
      onSwipeVerticalRight(dy);
    }
  }, [onSwipeHorizontal, onSwipeVerticalRight]);

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isSwiping.current) {
      onSwipeEnd();
      touchStartRef.current = null;
      return;
    }

    // Double tap detection
    const touch = e.changedTouches[0];
    const now = Date.now();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

    if (lastTapRef.current && now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
      const side = touch.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
      if (side === 'left') onDoubleTapLeft();
      else onDoubleTapRight();
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touch.clientX };
      setTimeout(() => {
        if (lastTapRef.current) {
          onTap();
          lastTapRef.current = null;
        }
      }, DOUBLE_TAP_DELAY);
    }
    touchStartRef.current = null;
  }, [onDoubleTapLeft, onDoubleTapRight, onTap, onSwipeEnd]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

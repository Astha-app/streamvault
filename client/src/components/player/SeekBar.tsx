import React, { useRef, useState, useCallback, MutableRefObject } from 'react';
import { useScrubbing } from '../../hooks/useScrubbing';
import { formatTime } from '../../utils/time';

interface SeekBarProps {
  currentTimeRef: MutableRefObject<number>;
  durationRef: MutableRefObject<number>;
  buffered: TimeRanges | null;
  onSeek: (time: number) => void;
  progressRef: MutableRefObject<number>; // 0-1, updated by RAF externally
}

/** High-performance seek bar — renders progress via direct DOM mutation, not React state */
export const SeekBar = React.memo(function SeekBar({
  currentTimeRef,
  durationRef,
  buffered,
  onSeek,
  progressRef,
}: SeekBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const visualProgressRef = useRef(0);

  // Called on every RAF tick from useScrubbing
  const handleScrubChange = useCallback((progress: number) => {
    visualProgressRef.current = progress;
    if (fillRef.current) {
      fillRef.current.style.width = `${progress * 100}%`;
    }
  }, []);

  const { trackRef, onPointerDown, onPointerMove, onPointerUp } = useScrubbing({
    duration: durationRef,
    onScrubChange: handleScrubChange,
    onScrubCommit: (time) => {
      setIsDragging(false);
      onSeek(time);
    },
  });

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onPointerDown(e);
  }, [onPointerDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(progress * (durationRef.current || 0));
    setHoverX(e.clientX - rect.left);
  }, [durationRef, trackRef]);

  const handleMouseLeave = useCallback(() => setHoverTime(null), []);

  // Update fill from RAF without React re-render (called externally via ref)
  React.useEffect(() => {
    let rafId: number;
    const loop = () => {
      if (!isDragging && fillRef.current) {
        const p = durationRef.current > 0 ? currentTimeRef.current / durationRef.current : 0;
        fillRef.current.style.width = `${p * 100}%`;
        progressRef.current = p;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isDragging, currentTimeRef, durationRef, progressRef]);

  // Build buffered ranges
  const bufferedRanges: { left: number; width: number }[] = [];
  if (buffered && durationRef.current > 0) {
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i) / durationRef.current;
      const end = buffered.end(i) / durationRef.current;
      bufferedRanges.push({ left: start * 100, width: (end - start) * 100 });
    }
  }

  return (
    <div className="relative w-full group/seekbar">
      {/* Hover tooltip */}
      {hoverTime !== null && (
        <div
          ref={tooltipRef}
          className="absolute -top-8 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-10 transform -translate-x-1/2"
          style={{ left: hoverX }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1 group-hover/seekbar:h-3 bg-white/20 rounded-full cursor-pointer transition-all duration-150 w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={durationRef.current}
        aria-valuenow={currentTimeRef.current}
      >
        {/* Buffered ranges */}
        {bufferedRanges.map((r, i) => (
          <div
            key={i}
            className="absolute top-0 h-full bg-white/30 rounded-full"
            style={{ left: `${r.left}%`, width: `${r.width}%` }}
          />
        ))}

        {/* Playback progress */}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 h-full bg-accent rounded-full pointer-events-none"
          style={{ width: '0%' }}
        />

        {/* Scrub handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/seekbar:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `${(isDragging ? visualProgressRef.current : (durationRef.current > 0 ? currentTimeRef.current / durationRef.current : 0)) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
      </div>
    </div>
  );
});

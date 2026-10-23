import { useCallback, useRef } from 'react';
import { PROGRESS_RING } from '../constants';
import { formatTime } from '../utils/formatTime';

export interface TimerDisplayProps {
  timeLeft: number;
  currentDuration: number;
  circumference: number;
  isDark: boolean;
  isDragging?: boolean;
  onSeekStart?: () => void;
  onSeek?: (newTime: number) => void;
  onSeekEnd?: () => void;
  onAdjustTime?: (delta: number) => void;
}

export function TimerDisplay({
  timeLeft,
  currentDuration,
  isDark,
  isDragging = false,
  onSeekStart,
  onSeek,
  onSeekEnd,
  onAdjustTime,
}: TimerDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const prevAngleRef = useRef<number | null>(null);

  // Calculates time from pointer event directly in unrotated coordinates
  const updateTimeFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || currentDuration <= 0 || !onSeek) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);

      // Angle clockwise from 12 o'clock in degrees [0, 360)
      const angleDeg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      const prevAngle = prevAngleRef.current;
      prevAngleRef.current = angleDeg;

      let ratio = angleDeg / 360;

      // Handle 12 o'clock boundary wrapping when dragging
      if (prevAngle !== null) {
        if (prevAngle > 300 && angleDeg < 60) {
          ratio = 1.0;
        } else if (prevAngle < 60 && angleDeg > 300) {
          ratio = 0.0;
        }
      }

      onSeek(ratio * currentDuration);
    },
    [currentDuration, onSeek],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    prevAngleRef.current = null;
    onSeekStart?.();
    updateTimeFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    updateTimeFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    prevAngleRef.current = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    onSeekEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onAdjustTime?.(e.shiftKey ? -5 : -1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onAdjustTime?.(e.shiftKey ? 5 : 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSeek?.(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek?.(currentDuration);
    }
  };

  // Math in unrotated coordinates: center = (150, 150), radius = 135
  const progressRatio =
    currentDuration > 0 ? Math.max(0, Math.min(1, timeLeft / currentDuration)) : 0;
  const rad = progressRatio * 2 * Math.PI;

  // Knob position in unrotated SVG space (0 = top / 12 o'clock)
  const knobX = PROGRESS_RING.VIEWBOX_SIZE / 2 + PROGRESS_RING.RADIUS * Math.sin(rad);
  const knobY = PROGRESS_RING.VIEWBOX_SIZE / 2 - PROGRESS_RING.RADIUS * Math.cos(rad);

  const largeArcFlag = progressRatio > 0.5 ? 1 : 0;

  // Arc path starting at 12 o'clock (150, 15) and sweeping clockwise to (knobX, knobY)
  const arcPath =
    progressRatio > 0.0001 && progressRatio < 0.9999
      ? `M ${PROGRESS_RING.VIEWBOX_SIZE / 2} ${PROGRESS_RING.VIEWBOX_SIZE / 2 - PROGRESS_RING.RADIUS} A ${PROGRESS_RING.RADIUS} ${PROGRESS_RING.RADIUS} 0 ${largeArcFlag} 1 ${knobX} ${knobY}`
      : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="slider"
      tabIndex={0}
      aria-label="Set timer duration"
      aria-valuemin={0}
      aria-valuemax={currentDuration}
      aria-valuenow={Math.round(timeLeft * 10) / 10}
      aria-valuetext={`${formatTime(timeLeft)} remaining`}
      title="Click or drag around the dial to set time"
      className={`relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none touch-none rounded-full cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 group ${
        isDark
          ? 'focus-visible:ring-zinc-400 focus-visible:ring-offset-zinc-950'
          : 'focus-visible:ring-zinc-600 focus-visible:ring-offset-zinc-50'
      }`}
    >
      <svg
        className="w-full h-full pointer-events-none overflow-visible"
        viewBox={`0 0 ${PROGRESS_RING.VIEWBOX_SIZE} ${PROGRESS_RING.VIEWBOX_SIZE}`}
        role="img"
        aria-label="Timer Progress"
      >
        <defs>
          <filter id="scrubber-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="2.5"
              floodColor="#000000"
              floodOpacity="0.4"
            />
          </filter>
        </defs>

        <circle
          cx={PROGRESS_RING.VIEWBOX_SIZE / 2}
          cy={PROGRESS_RING.VIEWBOX_SIZE / 2}
          r={PROGRESS_RING.RADIUS}
          className={`fill-transparent ${
            isDark
              ? 'stroke-zinc-900 group-hover:stroke-zinc-800'
              : 'stroke-zinc-200 group-hover:stroke-zinc-300'
          }`}
          strokeWidth={PROGRESS_RING.STROKE_WIDTH}
        />

        {/* Progress Arc */}
        {progressRatio >= 0.9999 ? (
          <circle
            cx={PROGRESS_RING.VIEWBOX_SIZE / 2}
            cy={PROGRESS_RING.VIEWBOX_SIZE / 2}
            r={PROGRESS_RING.RADIUS}
            className={`fill-transparent ${isDark ? 'stroke-zinc-100' : 'stroke-zinc-800'}`}
            strokeWidth={isDragging ? PROGRESS_RING.STROKE_WIDTH + 1.5 : PROGRESS_RING.STROKE_WIDTH}
          />
        ) : arcPath ? (
          <path
            d={arcPath}
            className={`fill-transparent ${isDark ? 'stroke-zinc-100' : 'stroke-zinc-800'}`}
            strokeWidth={isDragging ? PROGRESS_RING.STROKE_WIDTH + 1.5 : PROGRESS_RING.STROKE_WIDTH}
            strokeLinecap="round"
          />
        ) : null}

        {/* Draggable Scrubber Knob / Handle pinned exactly to (knobX, knobY) */}
        <g>
          <circle
            cx={knobX}
            cy={knobY}
            r={isDragging ? 9 : 7.5}
            filter="url(#scrubber-shadow)"
            className={`${
              isDark ? 'fill-zinc-100 stroke-zinc-950' : 'fill-zinc-900 stroke-zinc-50'
            }`}
            strokeWidth={isDragging ? 3 : 2.5}
          />
          <circle
            cx={knobX}
            cy={knobY}
            r={isDragging ? 3 : 2}
            className={`${isDark ? 'fill-zinc-950' : 'fill-zinc-50'}`}
          />
        </g>
      </svg>

      {/* Large Continuous Digits */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`text-5xl sm:text-6xl font-mono-numbers font-medium tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}

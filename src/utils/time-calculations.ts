import {TIMER_LIMITS} from '../constants';
import type {TimerDuration} from '../types';

/**
 * Calculates total seconds of timer duration with 2 decimal precision.
 */
export function getTimerDurationSec(duration: TimerDuration): number {
  const total =
    (duration.hours ?? 0) * 3600 +
    (duration.minutes ?? 0) * 60 +
    (duration.seconds ?? 0);
  const maxLimit = 59 * 3600 + 59 * 60 + 59;
  return Math.max(
    TIMER_LIMITS.MIN_TIMER_DURATION_SEC,
    Math.min(maxLimit, Math.round(total * 100) / 100),
  );
}

/**
 * Clamps numeric values within a min/max range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

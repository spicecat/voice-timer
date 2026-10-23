import { TIMER_LIMITS } from '../constants';
import type { TimerDuration } from '../types';

/**
 * Calculates total seconds of timer duration with 2 decimal precision.
 */
export function getTimerDurationSec(duration: TimerDuration): number {
  const total =
    (duration.hours ?? 0) * 3600 + (duration.minutes ?? 0) * 60 + (duration.seconds ?? 0);
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

/**
 * Generate a unique ID if needed.
 */
export function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculates total seconds for a timer step.
 */
export function getStepDuration(step: { hours: number; minutes: number; seconds: number }): number {
  return (step.hours || 0) * 3600 + (step.minutes || 0) * 60 + (step.seconds || 0);
}

/**
 * Calculates total seconds for a full loop (all steps).
 */
export function getLoopDuration(steps: { hours: number; minutes: number; seconds: number }[]): number {
  return steps.reduce((total, step) => total + getStepDuration(step), 0);
}

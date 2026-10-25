import {useCallback, useState} from 'react';
import {DEFAULT_NEW_SEGMENT_SECONDS, DEFAULT_SEGMENTS} from '../constants';
import type {TimerSegment} from '../types';
import {useLocalStorage} from './use-local-storage';

function generateSegmentId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseSegmentStateReturn {
  addSegment: () => void;
  clampedIndex: number;
  copySegment: (id: string) => void;
  currentSegment: TimerSegment;
  currentSegmentIndex: number;
  moveSegment: (fromIndex: number, toIndex: number) => void;
  removeSegment: (id: string) => void;
  safeSegments: TimerSegment[];
  segments: TimerSegment[];
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
  setSegments: (
    value: TimerSegment[] | ((val: TimerSegment[]) => TimerSegment[]),
  ) => void;
  updateSegment: (
    id: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => void;
}

export function useSegmentState(): UseSegmentStateReturn {
  const [segments, setSegments] = useLocalStorage<TimerSegment[]>(
    'voice_timer_segments',
    DEFAULT_SEGMENTS,
    'customtimer_steps',
  );
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const safeSegments =
    Array.isArray(segments) && segments.length > 0
      ? segments
      : DEFAULT_SEGMENTS;
  const clampedIndex = Math.min(currentSegmentIndex, safeSegments.length - 1);
  const currentSegment = safeSegments[clampedIndex];

  const updateSegment = useCallback(
    (id: string, hours: number, minutes: number, seconds: number) => {
      setSegments((prev) =>
        prev.map((s) => (s.id === id ? {...s, hours, minutes, seconds} : s)),
      );
    },
    [setSegments],
  );

  const addSegment = useCallback(() => {
    setSegments((prev) => [
      ...prev,
      {
        hours: 0,
        id: generateSegmentId(),
        minutes: 0,
        seconds: DEFAULT_NEW_SEGMENT_SECONDS,
      },
    ]);
  }, [setSegments]);

  const removeSegment = useCallback(
    (id: string) => {
      setSegments((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((s) => s.id !== id);
        setCurrentSegmentIndex((curr) => Math.min(curr, filtered.length - 1));
        return filtered;
      });
    },
    [setSegments],
  );

  const copySegment = useCallback(
    (id: string) => {
      setSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const copy = {...prev[idx], id: generateSegmentId()};
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        return next;
      });
    },
    [setSegments],
  );

  const moveSegment = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSegments((prev) => {
        if (
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);

        setCurrentSegmentIndex((curr) => {
          let nextIndex = curr;
          if (curr === fromIndex) {
            nextIndex = toIndex;
          } else if (fromIndex < curr && toIndex >= curr) {
            nextIndex = curr - 1;
          } else if (fromIndex > curr && toIndex <= curr) {
            nextIndex = curr + 1;
          }
          return nextIndex;
        });

        return next;
      });
    },
    [setSegments],
  );

  return {
    addSegment,
    clampedIndex,
    copySegment,
    currentSegment,
    currentSegmentIndex,
    moveSegment,
    removeSegment,
    safeSegments,
    segments,
    setCurrentSegmentIndex,
    setSegments,
    updateSegment,
  };
}

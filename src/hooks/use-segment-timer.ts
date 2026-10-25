import {useCallback} from 'react';
import type {
  SoundMode,
  SupportedLanguage,
  TimerSegment,
  TimerStatus,
} from '../types';
import {useAudioAnnouncer} from './use-audio-announcer';
import {useSegmentState} from './use-segment-state';
import {useTimerClock} from './use-timer-clock';

export interface UseSegmentTimerReturn {
  addSegment: () => void;
  adjustTime: (delta: number) => void;
  adjustVolume: (delta: number) => void;
  copySegment: (id: string) => void;
  currentDuration: number;
  currentSegmentIndex: number;
  cycleSoundMode: () => void;
  endSeek: () => void;
  goToNextSegment: () => void;
  goToPreviousSegment: () => void;
  goToSegment: (index: number) => void;
  isDragging: boolean;
  language: SupportedLanguage;
  moveSegment: (fromIndex: number, toIndex: number) => void;
  removeSegment: (id: string) => void;
  reset: () => void;
  seek: (newTime: number) => void;
  segments: TimerSegment[];
  setLanguage: (lang: SupportedLanguage) => void;
  setSoundMode: (mode: SoundMode) => void;
  setVolume: (vol: number) => void;
  soundMode: SoundMode;
  startSeek: () => void;
  status: TimerStatus;
  testSound: () => void;
  timeLeft: number;
  toggleMute: () => void;
  togglePlay: () => void;
  updateSegment: (
    id: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => void;
  volume: number;
}

/**
 * Top-level orchestrator hook composing modular sub-hooks:
 * - `useSegmentState`: Segment list state, persistence, and CRUD.
 * - `useAudioAnnouncer`: Voice synthesis, chime audio, sound modes, and volume.
 * - `useTimerClock`: High-precision RAF countdown engine & background Web Worker ticker.
 */
export function useSegmentTimer(): UseSegmentTimerReturn {
  const {
    safeSegments,
    clampedIndex,
    setCurrentSegmentIndex,
    addSegment,
    removeSegment,
    copySegment,
    moveSegment,
    updateSegment,
  } = useSegmentState();

  const {
    soundMode,
    soundModeRef,
    volume,
    volumeRef,
    language,
    setSoundMode,
    setVolume,
    setLanguage,
    adjustVolume,
    cycleSoundMode,
    toggleMute,
    triggerSegmentSound,
    testSound: testSoundAnnouncer,
  } = useAudioAnnouncer();

  const {
    status,
    timeLeft,
    timeLeftRef,
    currentDuration,
    isDragging,
    startSeek,
    seek,
    endSeek,
    adjustTime,
    togglePlay,
    reset,
    goToSegment,
    goToNextSegment,
    goToPreviousSegment,
  } = useTimerClock({
    currentSegmentIndex: clampedIndex,
    language,
    safeSegments,
    setCurrentSegmentIndex,
    soundModeRef,
    triggerSegmentSound,
    volumeRef,
  });

  const handleTestSound = useCallback(() => {
    testSoundAnnouncer(timeLeftRef.current);
  }, [testSoundAnnouncer, timeLeftRef]);

  return {
    addSegment,
    adjustTime,
    adjustVolume,
    copySegment,
    currentDuration,
    currentSegmentIndex: clampedIndex,
    cycleSoundMode,
    endSeek,
    goToNextSegment,
    goToPreviousSegment,
    goToSegment,
    isDragging,
    language,
    moveSegment,
    removeSegment,
    reset,
    seek,
    segments: safeSegments,
    setLanguage,
    setSoundMode,
    setVolume,
    soundMode,
    startSeek,
    status,
    testSound: handleTestSound,
    timeLeft,
    toggleMute,
    togglePlay,
    updateSegment,
    volume,
  };
}

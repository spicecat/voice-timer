import {useCallback, useEffect, useRef, useState} from 'react';
import {
  DEFAULT_NEW_SEGMENT_SECONDS,
  DEFAULT_SEGMENTS,
  DEFAULT_VOLUME,
  getBrowserLanguage,
} from '../constants';
import {
  initAudioContext,
  playChime,
  playVoiceNumber,
  preloadVoiceClips,
  stopAllAudio,
  testSound as testSoundService,
} from '../services/voice-audio-engine';
import type {
  SoundMode,
  SupportedLanguage,
  TimerSegment,
  TimerStatus,
} from '../types';
import {clamp, getTimerDurationSeconds} from '../utils';
import {useLocalStorage} from './use-local-storage';

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

/** Backward-compatible alias for UseSegmentTimerReturn */
export type UseIntervalTimerReturn = UseSegmentTimerReturn;

function getAnnouncementNumber(totalSeconds: number): number | null {
  const safe = Math.round(totalSeconds);
  if (safe >= 3600 && safe % 3600 === 0) {
    const hrs = Math.floor(safe / 3600);
    return hrs <= 59 ? hrs : null;
  }
  if (safe >= 60 && safe < 3600 && safe % 60 === 0) {
    const mins = Math.floor(safe / 60);
    return mins <= 59 ? mins : null;
  }
  if (safe < 60 && safe > 0) {
    return safe;
  }
  return null;
}

export function useSegmentTimer(): UseSegmentTimerReturn {
  const [segments, setSegments] = useLocalStorage<TimerSegment[]>(
    'voice_timer_segments',
    DEFAULT_SEGMENTS,
    'customtimer_steps',
  );
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [soundMode, setSoundModeState] = useLocalStorage<SoundMode>(
    'voice_timer_sound_mode',
    'chime',
    'customtimer_sound_mode',
  );
  const [lastActiveSoundMode, setLastActiveSoundMode] = useState<SoundMode>(
    soundMode !== 'off' ? soundMode : 'chime',
  );
  const [volume, setVolumeState] = useLocalStorage<number>(
    'voice_timer_volume',
    DEFAULT_VOLUME,
    'customtimer_volume',
  );
  const [language, setLanguage] = useLocalStorage<SupportedLanguage>(
    'voice_timer_language',
    getBrowserLanguage,
    'customtimer_language',
  );
  const [status, setStatus] = useState<TimerStatus>('idle');

  const safeSegments =
    Array.isArray(segments) && segments.length > 0
      ? segments
      : DEFAULT_SEGMENTS;
  const clampedIndex = Math.min(currentSegmentIndex, safeSegments.length - 1);
  const currentSegment = safeSegments[clampedIndex];
  const currentDuration = getTimerDurationSeconds(currentSegment);

  const [timeLeft, setTimeLeft] = useState<number>(() => currentDuration);
  const [isDragging, setIsDragging] = useState(false);

  // Synchronous refs to avoid stale closures during RAF and event updates
  const timeLeftRef = useRef(currentDuration);
  const currentSegmentIndexRef = useRef(clampedIndex);
  currentSegmentIndexRef.current = clampedIndex;
  const statusRef = useRef(status);
  statusRef.current = status;
  const soundModeRef = useRef(soundMode);
  soundModeRef.current = soundMode;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const languageRef = useRef(language);
  languageRef.current = language;
  const safeSegmentsRef = useRef(safeSegments);
  safeSegmentsRef.current = safeSegments;

  const wasRunningBeforeDragRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSecondCrossedRef = useRef<number | null>(null);

  useEffect(() => {
    const totalSecs = Math.ceil(currentDuration);
    preloadVoiceClips(language, [totalSecs]);
  }, [language, currentDuration]);

  // Clean up audio and RAF on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const triggerSegmentSound = useCallback(
    (seconds: number, isInitial = false) => {
      const mode = soundModeRef.current;
      const vol = volumeRef.current;
      const lang = languageRef.current;

      if (mode === 'voice') {
        const num = getAnnouncementNumber(seconds);
        if (num !== null) {
          playVoiceNumber(num, lang, vol);
        }
      } else if (mode === 'chime') {
        playChime(isInitial ? 'start' : 'beep', vol);
      }
    },
    [],
  );

  const setSoundMode = useCallback(
    (mode: SoundMode) => {
      if (mode !== 'off') {
        initAudioContext();
        preloadVoiceClips(language);
        setLastActiveSoundMode(mode);
      }
      setSoundModeState(mode);
    },
    [language, setSoundModeState],
  );

  const toggleMute = useCallback(() => {
    if (soundMode === 'off') {
      setSoundMode(lastActiveSoundMode || 'chime');
    } else {
      setSoundMode('off');
    }
  }, [soundMode, lastActiveSoundMode, setSoundMode]);

  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(clamp(vol, 0, 1));
    },
    [setVolumeState],
  );

  const adjustVolume = useCallback(
    (delta: number) => {
      setVolumeState((prev) =>
        clamp(Math.round((prev + delta) * 100) / 100, 0, 1),
      );
    },
    [setVolumeState],
  );

  const cycleSoundMode = useCallback(() => {
    const modes: SoundMode[] = ['voice', 'chime', 'off'];
    const idx = modes.indexOf(soundMode);
    const nextMode = modes[(idx + 1) % modes.length];
    setSoundMode(nextMode);
  }, [soundMode, setSoundMode]);

  const goToSegment = useCallback(
    (index: number) => {
      const currentList = safeSegmentsRef.current;
      const activeIdx = currentSegmentIndexRef.current;

      if (index === -1) {
        // Restart current segment
        const dur = getTimerDurationSeconds(currentList[activeIdx]);
        timeLeftRef.current = dur;
        setTimeLeft(dur);
        lastSecondCrossedRef.current = Math.ceil(dur);

        if (statusRef.current === 'running') {
          initAudioContext();
          triggerSegmentSound(Math.ceil(dur), true);
        } else if (statusRef.current === 'completed') {
          setStatus('paused');
        }
        return;
      }

      if (index >= 0 && index < currentList.length) {
        setCurrentSegmentIndex(index);
        currentSegmentIndexRef.current = index;
        const dur = getTimerDurationSeconds(currentList[index]);
        timeLeftRef.current = dur;
        setTimeLeft(dur);
        lastSecondCrossedRef.current = Math.ceil(dur);

        if (statusRef.current === 'running') {
          initAudioContext();
          triggerSegmentSound(Math.ceil(dur), true);
        } else if (statusRef.current === 'completed') {
          setStatus('paused');
        }
      }
    },
    [triggerSegmentSound],
  );

  const goToNextSegment = useCallback(() => {
    if (currentSegmentIndex < safeSegments.length - 1) {
      goToSegment(currentSegmentIndex + 1);
    }
  }, [currentSegmentIndex, safeSegments.length, goToSegment]);

  const goToPreviousSegment = useCallback(() => {
    const currentSegmentDur = getTimerDurationSeconds(
      safeSegments[currentSegmentIndex],
    );
    if (
      currentSegmentDur - timeLeftRef.current > 2 &&
      currentSegmentIndex > 0
    ) {
      goToSegment(currentSegmentIndex);
    } else if (currentSegmentIndex > 0) {
      goToSegment(currentSegmentIndex - 1);
    } else {
      goToSegment(0);
    }
  }, [currentSegmentIndex, safeSegments, goToSegment]);

  // Sync idle time when segments change
  useEffect(() => {
    if (status === 'idle') {
      const first = safeSegments[0];
      const dur = getTimerDurationSeconds(first);
      setCurrentSegmentIndex(0);
      currentSegmentIndexRef.current = 0;
      timeLeftRef.current = dur;
      setTimeLeft(dur);
    }
  }, [segments, status]);

  const handleTimerComplete = useCallback(() => {
    setStatus('completed');
    timeLeftRef.current = 0;
    setTimeLeft(0);
    lastSecondCrossedRef.current = null;
    if (soundModeRef.current !== 'off') {
      playChime('finish', volumeRef.current);
    }
  }, []);

  // RAF loop for smooth 60fps countdown with pure state updates and tab suspension resilience
  useEffect(() => {
    if (status !== 'running') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    lastTimestampRef.current = performance.now();

    const loop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsedSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Guard against giant gaps when browser tab was suspended
      const safeElapsed = Math.min(elapsedSec, 2.0);
      const prev = timeLeftRef.current;
      const next = Math.max(0, prev - safeElapsed);

      timeLeftRef.current = next;
      setTimeLeft(next);

      // Check whole second transition for sound announcements (PURE calculation outside of setState)
      const currentWholeSecond = Math.ceil(next);
      if (
        currentWholeSecond !== lastSecondCrossedRef.current &&
        currentWholeSecond > 0 &&
        next > 0
      ) {
        lastSecondCrossedRef.current = currentWholeSecond;
        triggerSegmentSound(currentWholeSecond, false);
      }

      // Check segment completion
      if (next <= 0) {
        const segs = safeSegmentsRef.current;
        const currentIdx = currentSegmentIndexRef.current;

        if (currentIdx < segs.length - 1) {
          const nextIndex = currentIdx + 1;
          currentSegmentIndexRef.current = nextIndex;
          setCurrentSegmentIndex(nextIndex);

          const nextDur = getTimerDurationSeconds(segs[nextIndex]);
          timeLeftRef.current = nextDur;
          setTimeLeft(nextDur);
          lastSecondCrossedRef.current = Math.ceil(nextDur);

          initAudioContext();
          triggerSegmentSound(Math.ceil(nextDur), true);
        } else {
          handleTimerComplete();
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [status, triggerSegmentSound, handleTimerComplete]);

  // Handle visibility changes so timestamp anchor doesn't cause sudden leap when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && statusRef.current === 'running') {
        lastTimestampRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const togglePlay = useCallback(() => {
    initAudioContext();
    preloadVoiceClips(language);

    if (status === 'running') {
      setStatus('paused');
      stopAllAudio();
    } else {
      if (status === 'completed') {
        setCurrentSegmentIndex(0);
        currentSegmentIndexRef.current = 0;
        const first = safeSegments[0];
        const full = getTimerDurationSeconds(first);
        timeLeftRef.current = full;
        setTimeLeft(full);
        lastSecondCrossedRef.current = Math.ceil(full);
        triggerSegmentSound(Math.ceil(full), true);
      } else {
        lastSecondCrossedRef.current = Math.ceil(timeLeftRef.current);
        triggerSegmentSound(Math.ceil(timeLeftRef.current), true);
      }
      setStatus('running');
    }
  }, [status, safeSegments, language, triggerSegmentSound]);

  const reset = useCallback(() => {
    initAudioContext();
    stopAllAudio();
    const isRunning = status === 'running';

    setCurrentSegmentIndex(0);
    currentSegmentIndexRef.current = 0;
    const first = safeSegments[0];
    const full = getTimerDurationSeconds(first);
    timeLeftRef.current = full;
    setTimeLeft(full);
    lastSecondCrossedRef.current = Math.ceil(full);

    if (isRunning) {
      triggerSegmentSound(Math.ceil(full), true);
    } else {
      setStatus('idle');
    }
  }, [status, safeSegments, triggerSegmentSound]);

  const testSound = useCallback(() => {
    const num = getAnnouncementNumber(Math.ceil(timeLeftRef.current)) || 3;
    testSoundService(soundMode === 'voice' ? 'voice' : 'chime', {
      lang: language,
      num,
      volume,
    });
  }, [soundMode, language, volume]);

  const startSeek = useCallback(() => {
    setIsDragging(true);
    initAudioContext();
    stopAllAudio();

    if (status === 'running') {
      wasRunningBeforeDragRef.current = true;
      setStatus('paused');
    } else {
      wasRunningBeforeDragRef.current = false;
      if (status === 'completed' || status === 'idle') setStatus('paused');
    }
  }, [status]);

  const seek = useCallback(
    (newTime: number) => {
      const clamped = clamp(
        Math.round(newTime * 100) / 100,
        0,
        currentDuration,
      );
      timeLeftRef.current = clamped;
      setTimeLeft(clamped);
      lastSecondCrossedRef.current = Math.ceil(clamped);
    },
    [currentDuration],
  );

  const endSeek = useCallback(() => {
    setIsDragging(false);
    if (wasRunningBeforeDragRef.current) {
      wasRunningBeforeDragRef.current = false;
      const curr = timeLeftRef.current;
      if (curr > 0.05) {
        setStatus('running');
        lastTimestampRef.current = performance.now();
        lastSecondCrossedRef.current = Math.ceil(curr);
        triggerSegmentSound(Math.ceil(curr), true);
      } else {
        handleTimerComplete();
      }
    }
  }, [triggerSegmentSound, handleTimerComplete]);

  const adjustTime = useCallback(
    (delta: number) => {
      initAudioContext();
      const prev = timeLeftRef.current;
      const next = clamp(
        Math.round((prev + delta) * 10) / 10,
        0,
        currentDuration,
      );
      timeLeftRef.current = next;
      setTimeLeft(next);
      lastSecondCrossedRef.current = Math.ceil(next);

      if (status === 'completed' || status === 'idle') {
        setStatus('paused');
      }
    },
    [currentDuration, status],
  );

  const updateSegment = useCallback(
    (id: string, hours: number, minutes: number, seconds: number) => {
      setSegments((prev) =>
        prev.map((s) => (s.id === id ? {...s, hours, minutes, seconds} : s)),
      );
    },
    [setSegments],
  );

  const addSegment = useCallback(() => {
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setSegments((prev) => [
      ...prev,
      {
        hours: 0,
        id: newId,
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
        const newId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const copy = {...prev[idx], id: newId};
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

        if (statusRef.current === 'idle') {
          setCurrentSegmentIndex(0);
          currentSegmentIndexRef.current = 0;
        } else {
          setCurrentSegmentIndex((curr) => {
            let nextIndex = curr;
            if (curr === fromIndex) {
              nextIndex = toIndex;
            } else if (fromIndex < curr && toIndex >= curr) {
              nextIndex = curr - 1;
            } else if (fromIndex > curr && toIndex <= curr) {
              nextIndex = curr + 1;
            }
            currentSegmentIndexRef.current = nextIndex;
            return nextIndex;
          });
        }

        return next;
      });
    },
    [setSegments],
  );

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
    testSound,
    timeLeft,
    toggleMute,
    togglePlay,
    updateSegment,
    volume,
  };
}

/** Backward-compatible alias for useSegmentTimer */
export const useIntervalTimer = useSegmentTimer;

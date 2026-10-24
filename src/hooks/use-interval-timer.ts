import {useCallback, useEffect, useRef, useState} from 'react';
import {
  DEFAULT_NEW_STEP_SECONDS,
  DEFAULT_STEPS,
  DEFAULT_VOICE_STYLE,
  DEFAULT_VOLUME,
  getBrowserLanguage,
} from '../constants';
import {
  initAudioContext,
  playChime,
  playVoiceNumber,
  preloadVoiceClips,
  stopAllAudio,
  testSound,
} from '../services/voice-audio-engine';
import type {
  SoundMode,
  SupportedLanguage,
  TimerStatus,
  TimerStep,
} from '../types';
import {clamp, getTimerDurationSec} from '../utils';
import {useLocalStorage} from './use-local-storage';

export interface UseIntervalTimerReturn {
  addSegment: () => void;
  copySegment: (id: string) => void;
  currentDuration: number;
  currentStepIndex: number;
  handleAdjustTime: (delta: number) => void;
  handleReset: () => void;
  handleSeek: (newTime: number) => void;
  handleSeekEnd: () => void;
  handleSeekStart: () => void;
  handleTestSound: () => void;
  isDragging: boolean;
  language: SupportedLanguage;
  removeSegment: (id: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setSoundMode: (mode: SoundMode) => void;
  setVolume: (vol: number) => void;
  soundMode: SoundMode;
  status: TimerStatus;
  steps: TimerStep[];
  timeLeft: number;
  togglePlay: () => void;
  updateStep: (
    id: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => void;
  volume: number;
}

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

export function useIntervalTimer(): UseIntervalTimerReturn {
  const [steps, setSteps] = useLocalStorage<TimerStep[]>(
    'customtimer_steps',
    DEFAULT_STEPS,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundMode, setSoundModeState] = useLocalStorage<SoundMode>(
    'customtimer_sound_mode',
    'chime',
  );
  const [volume, setVolumeState] = useLocalStorage<number>(
    'customtimer_volume',
    DEFAULT_VOLUME,
  );
  const [language, setLanguage] = useLocalStorage<SupportedLanguage>(
    'customtimer_language',
    getBrowserLanguage,
  );
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    getTimerDurationSec(steps[0] ?? DEFAULT_STEPS[0]),
  );
  const [isDragging, setIsDragging] = useState(false);
  const wasRunningBeforeDragRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSecondCrossedRef = useRef<number | null>(null);

  const safeSteps = steps.length > 0 ? steps : DEFAULT_STEPS;
  const currentStep =
    safeSteps[Math.min(currentStepIndex, safeSteps.length - 1)];
  const currentDuration = getTimerDurationSec(currentStep);

  useEffect(() => {
    const totalSecs = Math.ceil(currentDuration);
    preloadVoiceClips(language, [totalSecs]);
  }, [language, currentDuration]);

  useEffect(() => {
    return () => {
      stopAllAudio();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const setSoundMode = useCallback(
    (mode: SoundMode) => {
      if (mode !== 'off') {
        initAudioContext();
        preloadVoiceClips(language);
      }
      setSoundModeState(mode);
    },
    [language, setSoundModeState],
  );

  const setVolume = useCallback(
    (vol: number) => {
      setVolumeState(clamp(vol, 0, 1));
    },
    [setVolumeState],
  );

  // Sync idle time
  useEffect(() => {
    if (status === 'idle') {
      const first = safeSteps[0];
      setCurrentStepIndex(0);
      setTimeLeft(getTimerDurationSec(first));
    }
  }, [steps, status, safeSteps]);

  const handleTimerComplete = useCallback(() => {
    setStatus('completed');
    setTimeLeft(0);
    lastSecondCrossedRef.current = null;
    if (soundMode !== 'off') playChime('finish', volume);
  }, [soundMode, volume]);

  // Advance segment when timeLeft hits 0
  useEffect(() => {
    if (status !== 'running' || timeLeft > 0) return;
    if (currentStepIndex < safeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const dur = getTimerDurationSec(safeSteps[nextIndex]);
      setTimeLeft(dur);
      lastSecondCrossedRef.current = Math.ceil(dur);
      initAudioContext();
      if (soundMode === 'voice') {
        const num = getAnnouncementNumber(Math.ceil(dur));
        if (num !== null)
          playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
      } else if (soundMode === 'chime') {
        playChime('start', volume);
      }
    } else {
      handleTimerComplete();
    }
  }, [
    timeLeft,
    status,
    currentStepIndex,
    safeSteps,
    soundMode,
    language,
    volume,
    handleTimerComplete,
  ]);

  // RAF loop
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
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsedSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - elapsedSec);
        const currentWholeSecond = Math.ceil(next);
        if (
          currentWholeSecond !== lastSecondCrossedRef.current &&
          currentWholeSecond > 0 &&
          next > 0
        ) {
          lastSecondCrossedRef.current = currentWholeSecond;
          if (soundMode === 'voice') {
            const num = getAnnouncementNumber(currentWholeSecond);
            if (num !== null)
              playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
          } else if (soundMode === 'chime') {
            playChime('beep', volume);
          }
        }
        if (next <= 0) return 0;
        return next;
      });
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
  }, [status, soundMode, language, volume]);

  const togglePlay = useCallback(() => {
    initAudioContext();
    preloadVoiceClips(language);
    if (status === 'running') {
      setStatus('paused');
      stopAllAudio();
    } else {
      if (status === 'completed') {
        setCurrentStepIndex(0);
        const first = safeSteps[0];
        const full = getTimerDurationSec(first);
        setTimeLeft(full);
        lastSecondCrossedRef.current = Math.ceil(full);
        if (soundMode === 'voice') {
          const num = getAnnouncementNumber(Math.ceil(full));
          if (num !== null)
            playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
        }
        if (soundMode === 'chime') playChime('start', volume);
      } else {
        lastSecondCrossedRef.current = Math.ceil(timeLeft);
        if (soundMode === 'voice') {
          const num = getAnnouncementNumber(Math.ceil(timeLeft));
          if (num !== null)
            playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
        }
        if (soundMode === 'chime') playChime('beep', volume);
      }
      setStatus('running');
    }
  }, [status, safeSteps, soundMode, language, volume, timeLeft]);

  const handleReset = useCallback(() => {
    initAudioContext();
    stopAllAudio();
    const wasActive = status === 'running' || status === 'completed';
    setCurrentStepIndex(0);
    const first = safeSteps[0];
    const full = getTimerDurationSec(first);
    setTimeLeft(full);
    lastSecondCrossedRef.current = Math.ceil(full);
    setStatus('idle');
    if (wasActive && soundMode !== 'off') {
      if (soundMode === 'voice') {
        const num = getAnnouncementNumber(Math.ceil(full));
        if (num !== null)
          playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
      } else if (soundMode === 'chime') {
        playChime('beep', volume);
      }
    }
  }, [status, safeSteps, soundMode, language, volume]);

  const handleTestSound = useCallback(() => {
    const num = getAnnouncementNumber(Math.ceil(timeLeft)) || 3;
    testSound(soundMode === 'voice' ? 'voice' : 'chime', {
      lang: language,
      num,
      voiceStyle: DEFAULT_VOICE_STYLE,
      volume,
    });
  }, [soundMode, timeLeft, language, volume]);

  const handleSeekStart = useCallback(() => {
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

  const handleSeek = useCallback(
    (newTime: number) => {
      const clamped = clamp(
        Math.round(newTime * 100) / 100,
        0,
        currentDuration,
      );
      setTimeLeft(clamped);
      lastSecondCrossedRef.current = Math.ceil(clamped);
    },
    [currentDuration],
  );

  const handleSeekEnd = useCallback(() => {
    setIsDragging(false);
    if (wasRunningBeforeDragRef.current) {
      wasRunningBeforeDragRef.current = false;
      setTimeLeft((curr) => {
        if (curr > 0.05) {
          setStatus('running');
          lastTimestampRef.current = performance.now();
          lastSecondCrossedRef.current = Math.ceil(curr);
          if (soundMode === 'voice') {
            const num = getAnnouncementNumber(Math.ceil(curr));
            if (num !== null)
              playVoiceNumber(num, DEFAULT_VOICE_STYLE, language, volume);
          } else if (soundMode === 'chime') {
            playChime('beep', volume);
          }
        } else {
          handleTimerComplete();
        }
        return curr;
      });
    }
  }, [soundMode, language, volume, handleTimerComplete]);

  const handleAdjustTime = useCallback(
    (delta: number) => {
      initAudioContext();
      setTimeLeft((prev) => {
        const next = clamp(
          Math.round((prev + delta) * 10) / 10,
          0,
          currentDuration,
        );
        lastSecondCrossedRef.current = Math.ceil(next);
        return next;
      });
      if (status === 'completed' || status === 'idle') setStatus('paused');
    },
    [currentDuration, status],
  );

  const updateStep = useCallback(
    (id: string, hours: number, minutes: number, seconds: number) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? {...s, hours, minutes, seconds} : s)),
      );
    },
    [setSteps],
  );

  const addSegment = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      {
        hours: 0,
        id: String(Date.now()),
        minutes: 0,
        seconds: DEFAULT_NEW_STEP_SECONDS,
      },
    ]);
  }, [setSteps]);

  const removeSegment = useCallback(
    (id: string) => {
      setSteps((prev) =>
        prev.length <= 1 ? prev : prev.filter((s) => s.id !== id),
      );
    },
    [setSteps],
  );

  const copySegment = useCallback(
    (id: string) => {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const copy = {...prev[idx], id: String(Date.now() + Math.random())};
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        return next;
      });
    },
    [setSteps],
  );

  return {
    addSegment,
    copySegment,
    currentDuration,
    currentStepIndex,
    handleAdjustTime,
    handleReset,
    handleSeek,
    handleSeekEnd,
    handleSeekStart,
    handleTestSound,
    isDragging,
    language,
    removeSegment,
    setLanguage,
    setSoundMode,
    setVolume,
    soundMode,
    status,
    steps: safeSteps,
    timeLeft,
    togglePlay,
    updateStep,
    volume,
  };
}

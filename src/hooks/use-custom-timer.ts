import {useCallback, useEffect, useRef, useState} from 'react';
import {
  DEFAULT_TIMER_DURATION,
  DEFAULT_VOICE_STYLE,
  DEFAULT_VOLUME,
  getBrowserLanguage,
  PROGRESS_RING,
  TIMER_LIMITS,
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
  TimerDuration,
  TimerStatus,
  VoiceStyle,
} from '../types';
import {clamp, getTimerDurationSec} from '../utils';
import {useLocalStorage} from './use-local-storage';

export interface UseCustomTimerReturn {
  circumference: number;
  currentDuration: number;
  duration: TimerDuration;
  handleAdjustTime: (delta: number) => void;
  handleReset: () => void;
  handleSeek: (newTime: number) => void;
  handleSeekEnd: () => void;
  handleSeekStart: () => void;
  handleTestSound: () => void;
  isDragging: boolean;
  language: SupportedLanguage;
  progressRatio: number;
  setDuration: (hours: number, minutes: number, seconds: number) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setPresetSeconds: (totalSeconds: number) => void;
  setSoundMode: (mode: SoundMode) => void;
  setTimeManually: (newTime: number) => void;
  setVoiceStyle: (style: VoiceStyle) => void;
  setVolume: (vol: number) => void;
  soundMode: SoundMode;
  status: TimerStatus;
  strokeDashoffset: number;
  timeLeft: number;
  togglePlay: () => void;
  voiceStyle: VoiceStyle;
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

export function useCustomTimer(): UseCustomTimerReturn {
  // Timer duration with LocalStorage persistence
  const [duration, setDurationState] = useLocalStorage<TimerDuration>(
    'customtimer_duration',
    DEFAULT_TIMER_DURATION,
  );

  // Sound mode with LocalStorage persistence
  const [soundMode, setSoundModeState] = useLocalStorage<SoundMode>(
    'customtimer_sound_mode',
    'chime',
  );

  // Sound volume with LocalStorage persistence
  const [volume, setVolumeState] = useLocalStorage<number>(
    'customtimer_volume',
    DEFAULT_VOLUME,
  );

  // Voice playback preferences with LocalStorage persistence
  const [voiceStyle, setVoiceStyle] = useLocalStorage<VoiceStyle>(
    'customtimer_voice_style',
    DEFAULT_VOICE_STYLE,
  );

  // Extensible language option with LocalStorage persistence
  const [language, setLanguage] = useLocalStorage<SupportedLanguage>(
    'customtimer_language',
    getBrowserLanguage,
  );

  // Timer State with continuous decimal seconds
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    getTimerDurationSec(duration),
  );

  // Dragging / Manual seek state (pauses while dragging)
  const [isDragging, setIsDragging] = useState(false);
  const wasRunningBeforeDragRef = useRef(false);

  // Refs for continuous high-frequency timer loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSecondCrossedRef = useRef<number | null>(null);

  const currentDuration = getTimerDurationSec(duration);

  // Pre-load audio clips for current language and duration
  useEffect(() => {
    const totalSecs = Math.ceil(currentDuration);
    preloadVoiceClips(language, [totalSecs]);
  }, [language, currentDuration]);

  // Cleanup audio and animation frame when unmounting
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
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

  // Sync timeLeft when idle and duration is updated
  useEffect(() => {
    if (status === 'idle') {
      setTimeLeft(getTimerDurationSec(duration));
    }
  }, [duration, status]);

  // Set duration manually (hours, minutes, seconds)
  const setDuration = useCallback(
    (hours: number, minutes: number, seconds: number) => {
      const maxLimit = 59 * 3600 + 59 * 60 + 59;
      const rawTotal =
        Math.max(0, hours) * 3600 +
        Math.max(0, minutes) * 60 +
        Math.max(0, Math.min(59.99, Number.isFinite(seconds) ? seconds : 0));
      const clampedTotal = Math.max(
        TIMER_LIMITS.MIN_TIMER_DURATION_SEC,
        Math.min(maxLimit, Math.round(rawTotal * 100) / 100),
      );
      const h = Math.floor(clampedTotal / 3600);
      const m = Math.floor((clampedTotal % 3600) / 60);
      const s = Math.round((clampedTotal % 60) * 100) / 100;

      const newDur = {hours: h, minutes: m, seconds: s};
      setDurationState(newDur);

      if (status === 'idle' || status === 'completed') {
        setTimeLeft(getTimerDurationSec(newDur));
        if (status === 'completed') setStatus('idle');
      }
    },
    [setDurationState, status],
  );

  // Set duration from quick preset (total seconds)
  const setPresetSeconds = useCallback(
    (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setDuration(h, m, s);
    },
    [setDuration],
  );

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setStatus('completed');
    setTimeLeft(0);
    lastSecondCrossedRef.current = null;
    if (soundMode !== 'off') playChime('finish', volume);
  }, [soundMode, volume]);

  // Continuous high-frequency timer using requestAnimationFrame
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

      setTimeLeft((prev) => {
        const next = Math.max(0, prev - elapsedSec);

        // Detect whole second crossings for voice & chime
        const currentWholeSecond = Math.ceil(next);
        if (
          currentWholeSecond !== lastSecondCrossedRef.current &&
          currentWholeSecond > 0 &&
          next > 0
        ) {
          lastSecondCrossedRef.current = currentWholeSecond;

          if (soundMode === 'voice') {
            const num = getAnnouncementNumber(currentWholeSecond);
            if (num !== null) {
              playVoiceNumber(num, voiceStyle, language, volume);
            }
          } else if (soundMode === 'chime') {
            playChime('beep', volume);
          }
        }

        if (next <= 0) {
          handleTimerComplete();
          return 0;
        }

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
  }, [status, soundMode, voiceStyle, language, volume, handleTimerComplete]);

  // Play / Pause
  const togglePlay = useCallback(() => {
    initAudioContext();
    preloadVoiceClips(language);

    if (status === 'running') {
      setStatus('paused');
      stopAllAudio();
    } else {
      if (status === 'completed') {
        const fullDuration = getTimerDurationSec(duration);
        setTimeLeft(fullDuration);
        lastSecondCrossedRef.current = Math.ceil(fullDuration);
        if (soundMode === 'voice') {
          const num = getAnnouncementNumber(Math.ceil(fullDuration));
          if (num !== null) playVoiceNumber(num, voiceStyle, language, volume);
        }
        if (soundMode === 'chime') playChime('start', volume);
      } else {
        lastSecondCrossedRef.current = Math.ceil(timeLeft);
        if (soundMode === 'voice') {
          const num = getAnnouncementNumber(Math.ceil(timeLeft));
          if (num !== null) playVoiceNumber(num, voiceStyle, language, volume);
        }
        if (soundMode === 'chime') playChime('beep', volume);
      }
      setStatus('running');
    }
  }, [status, duration, timeLeft, soundMode, voiceStyle, language, volume]);

  // Reset: resets duration to full duration
  const handleReset = useCallback(() => {
    initAudioContext();
    stopAllAudio();

    const fullDuration = getTimerDurationSec(duration);
    setTimeLeft(fullDuration);
    lastSecondCrossedRef.current = Math.ceil(fullDuration);
    setStatus('idle');

    if (soundMode === 'voice') {
      const num = getAnnouncementNumber(Math.ceil(fullDuration));
      if (num !== null) playVoiceNumber(num, voiceStyle, language, volume);
    } else if (soundMode === 'chime') {
      playChime('beep', volume);
    }
  }, [duration, soundMode, voiceStyle, language, volume]);

  // Test Sound trigger
  const handleTestSound = useCallback(() => {
    const num = getAnnouncementNumber(Math.ceil(timeLeft)) || 3;
    testSound(soundMode === 'voice' ? 'voice' : 'chime', {
      lang: language,
      num,
      voiceStyle,
      volume,
    });
  }, [soundMode, timeLeft, voiceStyle, language, volume]);

  // Manual seek handlers
  const handleSeekStart = useCallback(() => {
    setIsDragging(true);
    initAudioContext();
    stopAllAudio();

    if (status === 'running') {
      wasRunningBeforeDragRef.current = true;
      setStatus('paused');
    } else {
      wasRunningBeforeDragRef.current = false;
      if (status === 'completed' || status === 'idle') {
        setStatus('paused');
      }
    }
  }, [status]);

  const handleSeek = useCallback(
    (newTime: number) => {
      const maxDuration = getTimerDurationSec(duration);
      const clamped = clamp(Math.round(newTime * 100) / 100, 0, maxDuration);
      setTimeLeft(clamped);
      lastSecondCrossedRef.current = Math.ceil(clamped);
    },
    [duration],
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
              playVoiceNumber(num, voiceStyle, language, volume);
          } else if (soundMode === 'chime') {
            playChime('beep', volume);
          }
        } else {
          handleTimerComplete();
        }
        return curr;
      });
    }
  }, [soundMode, voiceStyle, language, volume, handleTimerComplete]);

  const handleAdjustTime = useCallback(
    (delta: number) => {
      initAudioContext();
      const maxDuration = getTimerDurationSec(duration);
      setTimeLeft((prev) => {
        const next = clamp(
          Math.round((prev + delta) * 10) / 10,
          0,
          maxDuration,
        );
        lastSecondCrossedRef.current = Math.ceil(next);
        return next;
      });
      if (status === 'completed' || status === 'idle') {
        setStatus('paused');
      }
    },
    [duration, status],
  );

  const setTimeManually = useCallback(
    (newTime: number) => {
      handleSeek(newTime);
      if (status === 'completed' || status === 'idle') {
        setStatus('paused');
      }
    },
    [handleSeek, status],
  );

  const progressRatio = Math.max(0, Math.min(1, timeLeft / currentDuration));
  const circumference = 2 * Math.PI * PROGRESS_RING.RADIUS;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return {
    circumference,
    currentDuration,
    duration,
    handleAdjustTime,
    handleReset,
    handleSeek,
    handleSeekEnd,
    handleSeekStart,
    handleTestSound,
    isDragging,
    language,
    progressRatio,
    setDuration,
    setLanguage,
    setPresetSeconds,
    setSoundMode,
    setTimeManually,
    setVoiceStyle,
    setVolume,
    soundMode,
    status,
    strokeDashoffset,
    timeLeft,
    togglePlay,
    voiceStyle,
    volume,
  };
}

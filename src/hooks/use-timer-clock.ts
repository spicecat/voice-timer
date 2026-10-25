import {useCallback, useEffect, useRef, useState} from 'react';
import {
  initAudioContext,
  playChime,
  preloadVoiceClips,
  stopAllAudio,
} from '../services/voice-audio-engine';
import type {SupportedLanguage, TimerSegment, TimerStatus} from '../types';
import {clamp, getTimerDurationSeconds} from '../utils';

export interface UseTimerClockOptions {
  currentSegmentIndex: number;
  language: SupportedLanguage;
  safeSegments: TimerSegment[];
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
  soundModeRef: React.RefObject<string>;
  triggerSegmentSound: (seconds: number, isInitial?: boolean) => void;
  volumeRef: React.RefObject<number>;
}

export interface UseTimerClockReturn {
  adjustTime: (delta: number) => void;
  currentDuration: number;
  endSeek: () => void;
  goToNextSegment: () => void;
  goToPreviousSegment: () => void;
  goToSegment: (index: number) => void;
  isDragging: boolean;
  reset: () => void;
  seek: (newTime: number) => void;
  startSeek: () => void;
  status: TimerStatus;
  timeLeft: number;
  timeLeftRef: React.RefObject<number>;
  togglePlay: () => void;
}

export function useTimerClock({
  safeSegments,
  currentSegmentIndex,
  setCurrentSegmentIndex,
  language,
  triggerSegmentSound,
  soundModeRef,
  volumeRef,
}: UseTimerClockOptions): UseTimerClockReturn {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const safeIndex = Math.min(currentSegmentIndex, safeSegments.length - 1);
  const currentSegment = safeSegments[safeIndex];
  const currentDuration = getTimerDurationSeconds(currentSegment);

  const [timeLeft, setTimeLeft] = useState<number>(() => currentDuration);
  const [isDragging, setIsDragging] = useState(false);

  const timeLeftRef = useRef(currentDuration);
  const currentSegmentIndexRef = useRef(safeIndex);
  currentSegmentIndexRef.current = safeIndex;
  const statusRef = useRef(status);
  statusRef.current = status;
  const safeSegmentsRef = useRef(safeSegments);
  safeSegmentsRef.current = safeSegments;

  const wasRunningBeforeDragRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSecondCrossedRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Preload voice clips for current duration
  useEffect(() => {
    const totalSecs = Math.ceil(currentDuration);
    preloadVoiceClips(language, [totalSecs]);
  }, [language, currentDuration]);

  // Clean up audio, RAF, and Web Worker on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleTimerComplete = useCallback(() => {
    setStatus('completed');
    timeLeftRef.current = 0;
    setTimeLeft(0);
    lastSecondCrossedRef.current = null;
    if (soundModeRef.current !== 'off') {
      playChime('finish', volumeRef.current ?? 0.8);
    }
  }, [soundModeRef, volumeRef]);

  // Main countdown tick logic (pure calculation outside setState)
  const processDeltaTime = useCallback(
    (deltaSec: number) => {
      if (statusRef.current !== 'running') return;

      const safeElapsed = Math.min(deltaSec, 2.0);
      const prev = timeLeftRef.current;
      const next = Math.max(0, prev - safeElapsed);

      timeLeftRef.current = next;
      setTimeLeft(next);

      const currentWholeSecond = Math.ceil(next);
      if (
        currentWholeSecond !== lastSecondCrossedRef.current &&
        currentWholeSecond > 0 &&
        next > 0
      ) {
        lastSecondCrossedRef.current = currentWholeSecond;
        triggerSegmentSound(currentWholeSecond, false);
      }

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
        }
      }
    },
    [triggerSegmentSound, setCurrentSegmentIndex, handleTimerComplete],
  );

  // Web Worker ticker setup for background tab execution resilience
  useEffect(() => {
    if (typeof window === 'undefined' || !window.Worker) return;

    const workerCode = `
      let intervalId = null;
      let lastTime = 0;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (intervalId) clearInterval(intervalId);
          lastTime = performance.now();
          intervalId = setInterval(function() {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            self.postMessage({ type: 'tick', dt: dt });
          }, 50);
        } else if (e.data === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `;

    try {
      const blob = new Blob([workerCode], {type: 'application/javascript'});
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e) => {
        if (
          e.data?.type === 'tick' &&
          document.hidden &&
          statusRef.current === 'running'
        ) {
          processDeltaTime(e.data.dt);
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        workerRef.current = null;
      };
    } catch {
      // Worker fallback
    }
  }, [processDeltaTime]);

  // RequestAnimationFrame loop for main thread 60fps execution
  useEffect(() => {
    if (status !== 'running') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      return;
    }

    if (workerRef.current) {
      workerRef.current.postMessage('start');
    }

    lastTimestampRef.current = performance.now();

    const loop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsedSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (!document.hidden) {
        processDeltaTime(elapsedSec);
      }

      if (statusRef.current === 'running') {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
    };
  }, [status, processDeltaTime]);

  // Visibility change anchor
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
  }, [safeSegments, status, setCurrentSegmentIndex]);

  const goToSegment = useCallback(
    (index: number) => {
      const currentList = safeSegmentsRef.current;
      const activeIdx = currentSegmentIndexRef.current;

      if (index === -1) {
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
    [triggerSegmentSound, setCurrentSegmentIndex],
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
  }, [
    status,
    safeSegments,
    language,
    triggerSegmentSound,
    setCurrentSegmentIndex,
  ]);

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
  }, [status, safeSegments, triggerSegmentSound, setCurrentSegmentIndex]);

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

  return {
    adjustTime,
    currentDuration,
    endSeek,
    goToNextSegment,
    goToPreviousSegment,
    goToSegment,
    isDragging,
    reset,
    seek,
    startSeek,
    status,
    timeLeft,
    timeLeftRef,
    togglePlay,
  };
}

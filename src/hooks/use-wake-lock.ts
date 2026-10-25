import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocalStorage} from './use-local-storage';

export interface UseWakeLockReturn {
  isActive: boolean;
  isSupported: boolean;
  setWakeLockEnabled: (enabled: boolean) => void;
  wakeLockEnabled: boolean;
}

export function useWakeLock(isTimerRunning: boolean): UseWakeLockReturn {
  const [wakeLockEnabled, setWakeLockEnabled] = useLocalStorage<boolean>(
    'voice_timer_wake_lock',
    true,
    'customtimer_wake_lock',
  );
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const requestLock = useCallback(async () => {
    if (!isSupported || wakeLockRef.current !== null) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      wakeLockRef.current = lock;
      setIsActive(true);

      lock.addEventListener('release', () => {
        wakeLockRef.current = null;
        setIsActive(false);
      });
    } catch {
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, [isSupported]);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore release errors
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    if (isTimerRunning && wakeLockEnabled) {
      requestLock();
    } else {
      releaseLock();
    }
  }, [isTimerRunning, wakeLockEnabled, requestLock, releaseLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isTimerRunning &&
        wakeLockEnabled
      ) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerRunning, wakeLockEnabled, requestLock]);

  return {
    isActive,
    isSupported,
    setWakeLockEnabled,
    wakeLockEnabled,
  };
}

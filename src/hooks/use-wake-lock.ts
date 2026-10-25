import {useCallback, useEffect, useRef, useState} from 'react';

export interface UseWakeLockReturn {
  isActive: boolean;
  isSupported: boolean;
}

export function useWakeLock(isTimerRunning: boolean): UseWakeLockReturn {
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
    if (isTimerRunning) {
      requestLock();
    } else {
      releaseLock();
    }
  }, [isTimerRunning, requestLock, releaseLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTimerRunning) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerRunning, requestLock]);

  return {
    isActive,
    isSupported,
  };
}

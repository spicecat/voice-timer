import {useCallback, useRef, useState} from 'react';
import {DEFAULT_VOLUME, getBrowserLanguage} from '../constants';
import {
  initAudioContext,
  playChime,
  playVoiceNumber,
  preloadVoiceClips,
  testSound as testSoundService,
} from '../services/voice-audio-engine';
import type {SoundMode, SupportedLanguage} from '../types';
import {clamp} from '../utils';
import {useLocalStorage} from './use-local-storage';

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

export interface UseAudioAnnouncerReturn {
  adjustVolume: (delta: number) => void;
  cycleSoundMode: () => void;
  language: SupportedLanguage;
  languageRef: React.RefObject<SupportedLanguage>;
  setLanguage: (lang: SupportedLanguage) => void;
  setSoundMode: (mode: SoundMode) => void;
  setVolume: (vol: number) => void;
  soundMode: SoundMode;
  soundModeRef: React.RefObject<SoundMode>;
  testSound: (seconds: number) => void;
  toggleMute: () => void;
  triggerSegmentSound: (seconds: number, isInitial?: boolean) => void;
  volume: number;
  volumeRef: React.RefObject<number>;
}

export function useAudioAnnouncer(): UseAudioAnnouncerReturn {
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

  const soundModeRef = useRef(soundMode);
  soundModeRef.current = soundMode;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const languageRef = useRef(language);
  languageRef.current = language;

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

  const testSound = useCallback(
    (seconds: number) => {
      const num = getAnnouncementNumber(Math.ceil(seconds)) || 3;
      testSoundService(soundMode === 'voice' ? 'voice' : 'chime', {
        lang: language,
        num,
        volume,
      });
    },
    [soundMode, language, volume],
  );

  return {
    adjustVolume,
    cycleSoundMode,
    language,
    languageRef,
    setLanguage,
    setSoundMode,
    setVolume,
    soundMode,
    soundModeRef,
    testSound,
    toggleMute,
    triggerSegmentSound,
    volume,
    volumeRef,
  };
}

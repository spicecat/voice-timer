import type { IntervalStep, SoundMode, SupportedLanguage, VoiceStyle } from '../types';

const STORAGE_KEYS = {
  STEPS: 'looptimer_steps_v1',
  TARGET_LOOPS: 'looptimer_target_loops_v1',
  SOUND_MODE: 'looptimer_sound_mode_v1',
  VOLUME: 'looptimer_volume_v1',
  VOICE_STYLE: 'looptimer_voice_style_v1',
  LANGUAGE: 'looptimer_language_v1',
} as const;

export const storageService = {
  getSteps: <T extends IntervalStep[]>(fallback: T): T => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STEPS);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  },

  saveSteps: (steps: IntervalStep[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.STEPS, JSON.stringify(steps));
    } catch {}
  },

  getTargetLoops: (fallback: number): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TARGET_LOOPS);
      if (!stored) return fallback;
      const parsed = Number.parseInt(stored, 10);
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
    } catch {
      return fallback;
    }
  },

  saveTargetLoops: (loops: number): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TARGET_LOOPS, String(loops));
    } catch {}
  },

  getSoundMode: (fallback: SoundMode): SoundMode => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SOUND_MODE);
      if (stored === 'voice' || stored === 'chime' || stored === 'off') return stored;
      return fallback;
    } catch {
      return fallback;
    }
  },

  saveSoundMode: (mode: SoundMode): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MODE, mode);
    } catch {}
  },

  getVolume: (fallback: number): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOLUME);
      if (!stored) return fallback;
      const parsed = Number.parseFloat(stored);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
    } catch {
      return fallback;
    }
  },

  saveVolume: (vol: number): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, String(vol));
    } catch {}
  },

  getVoiceStyle: (fallback: VoiceStyle): VoiceStyle => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOICE_STYLE);
      if (stored === 'natural' || stored === 'digits') return stored;
      return fallback;
    } catch {
      return fallback;
    }
  },

  saveVoiceStyle: (style: VoiceStyle): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_STYLE, style);
    } catch {}
  },

  getLanguage: (fallback: SupportedLanguage): SupportedLanguage => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (stored === 'en') return stored;
      return fallback;
    } catch {
      return fallback;
    }
  },

  saveLanguage: (lang: SupportedLanguage): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch {}
  },

  clearAll: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch {}
  },
};

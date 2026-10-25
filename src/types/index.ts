import type {LanguageConfig, SupportedLanguage} from '../locales';

export type {LanguageConfig, SupportedLanguage};

export type SoundMode = 'voice' | 'chime' | 'off';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface TimerSegment {
  hours: number;
  id: string;
  minutes: number;
  seconds: number;
}

export type Theme = 'dark' | 'light';

export function isTimerSegment(value: unknown): value is TimerSegment {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.hours === 'number' &&
    typeof s.minutes === 'number' &&
    typeof s.seconds === 'number'
  );
}

export function isValidSoundMode(value: unknown): value is SoundMode {
  return value === 'voice' || value === 'chime' || value === 'off';
}

export function isValidTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

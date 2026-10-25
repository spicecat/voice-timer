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

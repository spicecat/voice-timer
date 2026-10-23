export type SoundMode = 'voice' | 'chime' | 'off';

export type VoiceStyle = 'natural' | 'digits';

/** Derived from the shared language manifest: src/constants/languages.json */
export type SupportedLanguage =
  keyof typeof import('../constants/languages.json');

export interface LanguageConfig {
  audioPath: string;
  code: SupportedLanguage;
  label: string;
  speechSynthesisLang: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

export type Theme = 'dark' | 'light';

export type SoundMode = 'voice' | 'chime' | 'off';

export type VoiceStyle = 'natural' | 'digits';

export type SupportedLanguage = 'en';

export interface LanguageConfig {
  code: SupportedLanguage;
  label: string;
  speechSynthesisLang: string;
  audioPath: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

export type Theme = 'dark' | 'light';

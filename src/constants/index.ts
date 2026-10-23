import type { VoiceStyle } from '../types';

export {
  DEFAULT_LANGUAGE,
  getBrowserLanguage,
  getLanguageConfig,
  SUPPORTED_LANGUAGES,
} from './languages';
export { sharedStyles } from './styles';

export const DEFAULT_TIMER_DURATION = {
  hours: 0,
  minutes: 5,
  seconds: 0,
};

export const DEFAULT_NEW_STEP_SECONDS = 30;

export const DEFAULT_TARGET_LOOPS = 5;

export const DEFAULT_STEPS = [
  { id: '1', hours: 0, minutes: 1, seconds: 0 },
  { id: '2', hours: 0, minutes: 0, seconds: 30 },
];

export const TIMER_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '60m', seconds: 3600 },
] as const;

export const DEFAULT_VOICE_STYLE: VoiceStyle = 'natural';
export const DEFAULT_VOLUME = 1.0;

export const TIMER_LIMITS = {
  MIN_HOURS: 0,
  MAX_HOURS: 59,
  MIN_MINUTES: 0,
  MAX_MINUTES: 59,
  MIN_SECONDS: 0,
  MAX_SECONDS: 59.99,
  MIN_TIMER_DURATION_SEC: 0.1,
} as const;

export const PROGRESS_RING = {
  RADIUS: 135,
  VIEWBOX_SIZE: 300,
  STROKE_WIDTH: 4,
} as const;

export const CHIME_FREQUENCIES = {
  BEEP: 880,
  START: [523.25, 783.99],
  FINISH: [523.25, 659.25, 783.99, 1046.5],
} as const;

export const SPEECH_CONFIG = {
  DEFAULT_RATE: 1.1,
  DEFAULT_PITCH: 1.0,
  DEFAULT_VOLUME: 1.0,
} as const;

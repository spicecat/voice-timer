import type {VoiceStyle} from '../types';

export {
  DEFAULT_LANGUAGE,
  getBrowserLanguage,
  getLanguageConfig,
  SUPPORTED_LANGUAGES,
} from './languages';
export {sharedStyles} from './styles';

export const DEFAULT_TIMER_DURATION = {
  hours: 0,
  minutes: 5,
  seconds: 0,
};

export const DEFAULT_NEW_STEP_SECONDS = 30;

export const DEFAULT_TARGET_LOOPS = 5;

export const DEFAULT_STEPS = [{hours: 0, id: '1', minutes: 0, seconds: 15}];

export const DEFAULT_VOICE_STYLE: VoiceStyle = 'natural';
export const DEFAULT_VOLUME = 1.0;

export const TIMER_LIMITS = {
  MAX_HOURS: 59,
  MAX_MINUTES: 59,
  MAX_SECONDS: 59.99,
  MIN_HOURS: 0,
  MIN_MINUTES: 0,
  MIN_SECONDS: 0,
  MIN_TIMER_DURATION_SEC: 0.1,
} as const;

export const PROGRESS_RING = {
  RADIUS: 135,
  STROKE_WIDTH: 4,
  VIEWBOX_SIZE: 300,
} as const;

export const CHIME_FREQUENCIES = {
  BEEP: 880,
  FINISH: [523.25, 659.25, 783.99, 1046.5],
  START: [523.25, 783.99],
} as const;

export const SPEECH_CONFIG = {
  DEFAULT_PITCH: 1.0,
  DEFAULT_RATE: 1.1,
  DEFAULT_VOLUME: 1.0,
} as const;

import type {VoiceStyle} from '../types';

export {
  DEFAULT_LANGUAGE,
  getBrowserLanguage,
  getLanguageConfig,
  SUPPORTED_LANGUAGES,
} from './languages';
export {sharedStyles} from './styles';

export const DEFAULT_NEW_STEP_SECONDS = 30;

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

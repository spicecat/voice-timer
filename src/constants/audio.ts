export type ChimeType = 'beep' | 'start' | 'finish';

export interface ChimeTone {
  decay: number;
  delaySec: number;
  freq: number;
  gain: number;
}

export interface ChimeRecipe {
  duration: number;
  tones: ChimeTone[];
}

export const CHIME_RECIPES: Record<ChimeType, ChimeRecipe> = {
  beep: {
    duration: 0.15,
    tones: [{decay: 15, delaySec: 0, freq: 880, gain: 0.5}],
  },
  finish: {
    duration: 0.8,
    tones: [
      {decay: 4, delaySec: 0, freq: 523.25, gain: 0.25},
      {decay: 4, delaySec: 0.08, freq: 659.25, gain: 0.25},
      {decay: 4, delaySec: 0.16, freq: 783.99, gain: 0.25},
      {decay: 4, delaySec: 0.24, freq: 1046.5, gain: 0.25},
    ],
  },
  start: {
    duration: 0.4,
    tones: [
      {decay: 6, delaySec: 0, freq: 523.25, gain: 0.3},
      {decay: 6, delaySec: 0.05, freq: 783.99, gain: 0.3},
    ],
  },
};

export const AUDIO_CONSTANTS = {
  CHIME_BITRATE_KBPS: 48,
  DEFAULT_VOLUME: 1.0,
  FADE_SEC: 0.005,
  PAD_END_SEC: 0.04,
  PAD_START_SEC: 0.01,
  TRIM_THRESHOLD: 0.005,
  VOICE_BITRATE_KBPS: 32,
  VOICE_SAMPLE_RATE: 44100,
} as const;

export const DEFAULT_VOLUME = AUDIO_CONSTANTS.DEFAULT_VOLUME;

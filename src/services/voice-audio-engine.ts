import {
  CHIME_RECIPES,
  type ChimeType,
  DEFAULT_LANGUAGE,
  getLanguageConfig,
} from '../constants';
import type {SupportedLanguage} from '../types';

export type {ChimeType};

let audioCtx: AudioContext | null = null;

// Multi-language audio buffer cache: key format `${lang}:${number}`
const audioBufferCache = new Map<string, AudioBuffer>();
const pendingFetches = new Map<string, Promise<AudioBuffer | null>>();

// Chime buffer cache & in-flight requests
const chimeBufferCache = new Map<string, AudioBuffer>();
const pendingChimeFetches = new Map<string, Promise<AudioBuffer | null>>();

// Track all active audio nodes (buffers, oscillators) to stop cleanly
const activeAudioNodes = new Set<{
  disconnect: () => void;
  stop: () => void;
}>();

/**
 * Synchronously initializes AudioContext reference if needed.
 */
export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext})
        .webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (err) {
    console.warn('AudioContext init error:', err);
  }

  return audioCtx;
}

/**
 * Asynchronously guarantees AudioContext is unlocked and in 'running' state.
 */
export async function ensureAudioContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null;

  const ctx = initAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn('Failed to resume AudioContext:', err);
    }
  }
  return ctx;
}

/**
 * Constructs cache key for language-scoped audio buffers.
 */
function getCacheKey(lang: SupportedLanguage, num: number): string {
  return `${lang}:${num}`;
}

/**
 * Fetches and decodes an audio file into an in-memory AudioBuffer for a specific language.
 */
async function getOrFetchBuffer(
  num: number,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): Promise<AudioBuffer | null> {
  const cacheKey = getCacheKey(lang, num);

  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey) || null;
  }

  if (pendingFetches.has(cacheKey)) {
    return pendingFetches.get(cacheKey) || null;
  }

  const ctx = await ensureAudioContext();
  if (!ctx) return null;

  const langConfig = getLanguageConfig(lang);
  const audioUrl = `${langConfig.audioPath}/${num}.opus`;

  const fetchPromise = (async () => {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBufferCache.set(cacheKey, decoded);
      return decoded;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(cacheKey);
    }
  })();

  pendingFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Preloads audio clips in the background for the current language.
 */
export function preloadVoiceClips(
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  priorityKeys?: number[],
): void {
  if (typeof window === 'undefined') return;

  const prioritySet = new Set<number>([
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    ...(priorityKeys ?? []),
  ]);

  for (const k of prioritySet) {
    if (k >= 1 && k <= 59) {
      getOrFetchBuffer(k, lang);
    }
  }

  const remainingKeys = Array.from({length: 59}, (_, i) => i + 1).filter(
    (k) => !prioritySet.has(k),
  );

  const loadRemainingChunk = (index: number) => {
    if (index >= remainingKeys.length) return;
    const chunk = remainingKeys.slice(index, index + 5);
    for (const k of chunk) {
      getOrFetchBuffer(k, lang);
    }
    if (index + 5 < remainingKeys.length) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => loadRemainingChunk(index + 5), {
          timeout: 2000,
        });
      } else {
        setTimeout(() => loadRemainingChunk(index + 5), 200);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadRemainingChunk(0), {timeout: 1000});
  } else {
    setTimeout(() => loadRemainingChunk(0), 300);
  }
}

/**
 * Immediately stops any currently playing audio buffers, procedural synthesizers, and Web Speech synthesis.
 */
export function stopAllAudio(): void {
  for (const item of activeAudioNodes) {
    try {
      item.stop();
      item.disconnect();
    } catch {}
  }
  activeAudioNodes.clear();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Plays a decoded AudioBuffer directly via Web Audio API, tracking it for stopAllAudio().
 */
function playBuffer(
  buffer: AudioBuffer,
  volume = 1.0,
  delaySec = 0,
): AudioBufferSourceNode | null {
  if (!audioCtx) initAudioContext();
  if (!audioCtx) return null;

  try {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      audioCtx.currentTime,
    );

    source.connect(gain);
    gain.connect(audioCtx.destination);

    const startTime = audioCtx.currentTime + delaySec;
    source.start(startTime);

    const trackedNode = {
      disconnect: () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch {}
      },
      stop: () => {
        try {
          source.stop();
        } catch {}
      },
    };

    activeAudioNodes.add(trackedNode);
    source.onended = () => {
      activeAudioNodes.delete(trackedNode);
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    };

    return source;
  } catch (err) {
    console.warn('Error playing audio buffer:', err);
    return null;
  }
}

/**
 * Fallback procedural Web Audio synthesis for chimes when offline or audio files are unavailable.
 */
function playProceduralChime(
  ctx: AudioContext,
  type: ChimeType,
  volume = 0.8,
): void {
  const recipe = CHIME_RECIPES[type];
  if (!recipe) return;
  const now = ctx.currentTime;

  for (const tone of recipe.tones) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, now + tone.delaySec);

      const peakGain = Math.max(0, Math.min(1, volume * tone.gain));
      gain.gain.setValueAtTime(0.0001, now + tone.delaySec);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, peakGain),
        now + tone.delaySec + 0.004,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + tone.delaySec + 1 / tone.decay,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + tone.delaySec;
      const stopTime = startTime + 1 / tone.decay + 0.05;
      osc.start(startTime);
      osc.stop(stopTime);

      const tracked = {
        disconnect: () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        },
        stop: () => {
          try {
            osc.stop();
          } catch {}
        },
      };

      activeAudioNodes.add(tracked);
      osc.onended = () => {
        activeAudioNodes.delete(tracked);
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch (err) {
      console.warn('Procedural chime synthesis tone error:', err);
    }
  }
}

/**
 * Fallback voice countdown using Web Speech API if Opus audio clip is missing or fails.
 */
function speakFallbackNumber(
  num: number,
  lang: SupportedLanguage,
  volume = 0.8,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(String(num));
    const langConfig = getLanguageConfig(lang);
    utterance.lang = langConfig.speechSynthesisLang || 'en-US';
    utterance.volume = Math.max(0, Math.min(1, volume));
    window.speechSynthesis.speak(utterance);
  } catch {}
}

/**
 * Plays a voice countdown number using language-scoped pre-rendered audio buffers.
 * Falls back to Web Speech API if audio files cannot be loaded.
 */
export async function playVoiceNumber(
  num: number,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  volume = 0.8,
): Promise<void> {
  if (!Number.isFinite(num)) return;
  const wholeNumber = Math.max(0, Math.floor(num));
  stopAllAudio();

  const ctx = await ensureAudioContext();
  if (!ctx) return;

  if (wholeNumber <= 59) {
    const buffer = await getOrFetchBuffer(wholeNumber, lang);
    if (buffer) {
      stopAllAudio();
      playBuffer(buffer, volume, 0);
      return;
    }
  }

  // Fallback to speech synthesis if audio file unavailable
  speakFallbackNumber(wholeNumber, lang, volume);
}

/**
 * Dedicated sound test function.
 */
export async function testSound(
  mode: 'voice' | 'chime',
  options?: {
    lang?: SupportedLanguage;
    num?: number;
    volume?: number;
  },
): Promise<void> {
  await ensureAudioContext();
  const vol = options?.volume ?? 0.8;

  if (mode === 'voice') {
    const sampleNum =
      options?.num !== undefined && options.num > 0 ? options.num : 3;
    await playVoiceNumber(sampleNum, options?.lang ?? DEFAULT_LANGUAGE, vol);
  } else if (mode === 'chime') {
    playChime('beep', vol);
  }
}

/**
 * Fetches and decodes chime audio files with procedural synthesis fallback.
 */
async function getOrFetchChimeBuffer(
  type: ChimeType,
): Promise<AudioBuffer | null> {
  if (chimeBufferCache.has(type)) {
    return chimeBufferCache.get(type) || null;
  }
  if (pendingChimeFetches.has(type)) {
    return pendingChimeFetches.get(type) || null;
  }

  const ctx = await ensureAudioContext();
  if (!ctx) return null;

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`/audio/${type}.opus`);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      chimeBufferCache.set(type, decoded);
      return decoded;
    } catch (err) {
      console.warn(
        `Could not load pre-recorded chime ${type}, will use procedural synthesis:`,
        err,
      );
      return null;
    } finally {
      pendingChimeFetches.delete(type);
    }
  })();

  pendingChimeFetches.set(type, fetchPromise);
  return fetchPromise;
}

export async function playChime(type: ChimeType, volume = 0.8): Promise<void> {
  initAudioContext();
  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const buffer = await getOrFetchChimeBuffer(type);
  if (buffer) {
    playBuffer(buffer, volume, 0);
  } else {
    // Zero-dependency, offline procedural audio fallback
    playProceduralChime(ctx, type, volume);
  }
}

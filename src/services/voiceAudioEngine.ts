import { DEFAULT_LANGUAGE, DEFAULT_VOICE_STYLE, getLanguageConfig } from '../constants';
import type { SupportedLanguage, VoiceStyle } from '../types';

let audioCtx: AudioContext | null = null;

// Multi-language audio buffer cache: key format `${lang}:${number}`
const audioBufferCache = new Map<string, AudioBuffer>();
const pendingFetches = new Map<string, Promise<AudioBuffer | null>>();

// Chime buffer cache
const chimeBufferCache = new Map<string, AudioBuffer>();

let activeSourceNode: AudioBufferSourceNode | null = null;
let activeDigitTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Synchronously initializes AudioContext reference if needed.
 */
export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
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
  const audioUrl = `${langConfig.audioPath}/${num}.mp3`;

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

  const prioritySet = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...(priorityKeys ?? [])]);

  for (const k of prioritySet) {
    if (k >= 1 && k <= 59) {
      getOrFetchBuffer(k, lang);
    }
  }

  const remainingKeys = Array.from({ length: 59 }, (_, i) => i + 1).filter(
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
        window.requestIdleCallback(() => loadRemainingChunk(index + 5), { timeout: 2000 });
      } else {
        setTimeout(() => loadRemainingChunk(index + 5), 200);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadRemainingChunk(0), { timeout: 1000 });
  } else {
    setTimeout(() => loadRemainingChunk(0), 300);
  }
}

/**
 * Immediately stops any currently playing voice audio buffer and queued digit timeouts.
 */
export function stopAllAudio(): void {
  if (activeDigitTimeout) {
    clearTimeout(activeDigitTimeout);
    activeDigitTimeout = null;
  }

  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }
}

/**
 * Plays a decoded AudioBuffer directly via Web Audio API.
 */
function playBuffer(buffer: AudioBuffer, volume = 1.0, delaySec = 0): AudioBufferSourceNode | null {
  if (!audioCtx) initAudioContext();
  if (!audioCtx) return null;

  try {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioCtx.currentTime);

    source.connect(gain);
    gain.connect(audioCtx.destination);

    const startTime = audioCtx.currentTime + delaySec;
    source.start(startTime);
    return source;
  } catch (err) {
    console.warn('Error playing audio buffer:', err);
    return null;
  }
}

/**
 * Plays a voice countdown number using language-scoped pre-rendered audio buffers.
 */
export async function playVoiceNumber(
  num: number,
  style: VoiceStyle = DEFAULT_VOICE_STYLE,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  volume = 0.8,
): Promise<void> {
  const wholeNumber = Math.max(0, Math.floor(num));
  stopAllAudio();

  const ctx = await ensureAudioContext();
  if (!ctx) return;

  // Handle digit-by-digit style
  if (style === 'digits' && wholeNumber >= 10 && wholeNumber <= 59) {
    const digits = String(wholeNumber).split('').map(Number);
    const firstDigitBuffer = await getOrFetchBuffer(digits[0], lang);
    const secondDigitBuffer = await getOrFetchBuffer(digits[1], lang);

    if (firstDigitBuffer && secondDigitBuffer) {
      activeSourceNode = playBuffer(firstDigitBuffer, volume, 0);

      activeDigitTimeout = setTimeout(() => {
        if (ctx.state === 'running') {
          activeSourceNode = playBuffer(secondDigitBuffer, volume, 0);
        }
      }, 280);
      return;
    }
  }

  // Handle natural number style (0 to 59)
  if (wholeNumber <= 59) {
    const buffer = await getOrFetchBuffer(wholeNumber, lang);
    if (buffer) {
      activeSourceNode = playBuffer(buffer, volume, 0);
      return;
    }
  }
}

/**
 * Dedicated sound test function.
 */
export async function testSound(
  mode: 'voice' | 'chime',
  options?: {
    num?: number;
    voiceStyle?: VoiceStyle;
    lang?: SupportedLanguage;
    volume?: number;
  },
): Promise<void> {
  await ensureAudioContext();
  const vol = options?.volume ?? 0.8;

  if (mode === 'voice') {
    const sampleNum = options?.num !== undefined && options.num > 0 ? options.num : 3;
    await playVoiceNumber(
      sampleNum,
      options?.voiceStyle ?? DEFAULT_VOICE_STYLE,
      options?.lang ?? DEFAULT_LANGUAGE,
      vol,
    );
  } else if (mode === 'chime') {
    playChime('beep', vol);
  }
}

/**
 * Backward compatible export for speakNumber.
 */
export async function speakNumber(
  num: number | string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  volume = 0.8,
): Promise<void> {
  const parsed = typeof num === 'number' ? num : Number.parseInt(String(num), 10);
  if (Number.isFinite(parsed)) {
    await playVoiceNumber(parsed, DEFAULT_VOICE_STYLE, lang, volume);
  }
}

export type ChimeType = 'beep' | 'start' | 'finish';

/**
 * Fetches and plays chime audio files from public/audio.
 */
async function getOrFetchChimeBuffer(type: ChimeType): Promise<AudioBuffer | null> {
  if (chimeBufferCache.has(type)) {
    return chimeBufferCache.get(type) || null;
  }
  const ctx = await ensureAudioContext();
  if (!ctx) return null;

  try {
    const response = await fetch(`/audio/${type}.wav`);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    chimeBufferCache.set(type, decoded);
    return decoded;
  } catch (err) {
    console.warn(`Error loading chime ${type}:`, err);
    return null;
  }
}

export async function playChime(type: ChimeType, volume = 0.8): Promise<void> {
  initAudioContext();
  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const buffer = await getOrFetchChimeBuffer(type);
  if (buffer) {
    playBuffer(buffer, volume, 0);
  }
}

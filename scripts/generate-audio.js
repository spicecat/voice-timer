import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import opus from '@audio/encode-opus';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

const VOICE_SAMPLE_RATE = 44100;
const VOICE_BITRATE_KBPS = 32;
const FADE_SEC = 0.005;
const TRIM_THRESHOLD = 0.005;
const PAD_START_SEC = 0.01;
const PAD_END_SEC = 0.04;

// --- Language definitions (loaded from modular locale packs: src/locales/<lang>/voice.json) ---

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

function loadLanguages() {
  const entries = fs.readdirSync(LOCALES_DIR, {withFileTypes: true});
  const languages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const voiceJsonPath = path.join(LOCALES_DIR, entry.name, 'voice.json');
    if (!fs.existsSync(voiceJsonPath)) continue;

    let lang;
    try {
      lang = JSON.parse(fs.readFileSync(voiceJsonPath, 'utf8'));
    } catch (err) {
      throw new Error(
        `Failed to read voice manifest at ${voiceJsonPath}: ${err.message}`,
      );
    }

    const code = lang.code || entry.name;
    if (
      !Array.isArray(lang.numbers) ||
      lang.numbers.length !== 60 ||
      lang.numbers.some((word) => typeof word !== 'string' || !word.trim())
    ) {
      throw new Error(
        `${code}: "numbers" in ${voiceJsonPath} must be an array of exactly 60 non-empty number words (0-59), got ${Array.isArray(lang.numbers) ? `${lang.numbers.length} entries` : typeof lang.numbers}`,
      );
    }
    if (typeof lang.voice !== 'string' || !lang.voice.trim()) {
      throw new Error(
        `${code}: "voice" in ${voiceJsonPath} must be a non-empty string`,
      );
    }

    languages.push({
      code,
      numbers: lang.numbers,
      // SAY_VOICE env still overrides the manifest voice for ad-hoc testing
      voice: process.env.SAY_VOICE ?? lang.voice,
    });
  }

  if (languages.length === 0) {
    throw new Error(`No voice manifests found in ${LOCALES_DIR}`);
  }

  return languages;
}

const LANGUAGES = loadLanguages();

/**
 * Encodes planar-32-bit-float PCM into a complete Ogg Opus file.
 * @param {Float32Array[]} planarPcm - one Float32Array per channel, [-1, 1]
 */
async function encodeOggOpus(planarPcm, sampleRate, bitrateKbps, application) {
  const encoder = await opus({
    application,
    bitrate: bitrateKbps,
    channels: planarPcm.length,
    sampleRate,
  });
  const head = encoder.encode(planarPcm);
  const tail = encoder.flush();
  const file = new Uint8Array(head.length + tail.length);
  file.set(head, 0);
  file.set(tail, head.length);
  return file;
}

// --- Voices (0-59 spoken number names, macOS `say` TTS) ---

function readWav(filePath) {
  const buf = fs.readFileSync(filePath);
  if (
    buf.toString('ascii', 0, 4) !== 'RIFF' ||
    buf.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    throw new Error(`Not a WAV file: ${filePath}`);
  }

  let offset = 12;
  let sampleRate = VOICE_SAMPLE_RATE;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === 'fmt ') {
      sampleRate = buf.readUInt32LE(offset + 12);
    } else if (chunkId === 'data') {
      const data = buf.subarray(
        offset + 8,
        Math.min(offset + 8 + chunkSize, buf.length),
      );
      const samples = new Int16Array(Math.floor(data.length / 2));
      for (let i = 0; i < samples.length; i++)
        samples[i] = data.readInt16LE(i * 2);
      return {sampleRate, samples};
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  throw new Error(`No data chunk in WAV: ${filePath}`);
}

function trimAndFade(samples, sampleRate) {
  let start = 0;
  let end = samples.length - 1;
  while (
    start < samples.length &&
    Math.abs(samples[start]) / 0x8000 < TRIM_THRESHOLD
  )
    start++;
  while (end >= 0 && Math.abs(samples[end]) / 0x8000 < TRIM_THRESHOLD) end--;

  if (start > end) return new Float32Array(0);

  const padStartSamples = Math.floor(PAD_START_SEC * sampleRate);
  const padEndSamples = Math.floor(PAD_END_SEC * sampleRate);
  const fadeSamples = Math.max(1, Math.floor(FADE_SEC * sampleRate));
  const clipStart = Math.max(0, start - padStartSamples);
  const clipEnd = Math.min(samples.length - 1, end + padEndSamples);
  const out = new Float32Array(clipEnd - clipStart + 1);
  for (let i = 0; i < out.length; i++) out[i] = samples[clipStart + i] / 0x8000;

  for (let i = 0; i < fadeSamples && i < out.length; i++) {
    const g = i / fadeSamples;
    out[i] *= g;
    out[out.length - 1 - i] *= g;
  }
  return out;
}

async function generateVoices(lang) {
  const outputDir = path.join(PUBLIC_AUDIO_DIR, lang.code);
  fs.rmSync(outputDir, {force: true, recursive: true});
  fs.mkdirSync(outputDir, {recursive: true});

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `voice-timer-${lang.code}-`),
  );
  const totalSecs = [];

  for (let n = 0; n <= 59; n++) {
    const name = lang.numbers[n];
    const rawWav = path.join(tmpDir, `${n}_raw.wav`);

    execFileSync('say', [
      '-v',
      lang.voice,
      '--data-format=LEI16@44100',
      '--file-format=WAVE',
      '-o',
      rawWav,
      name,
    ]);
    const {samples, sampleRate} = readWav(rawWav);
    const pcm = trimAndFade(samples, sampleRate);
    const file = await encodeOggOpus(
      [pcm],
      sampleRate,
      VOICE_BITRATE_KBPS,
      'voip',
    );
    fs.writeFileSync(path.join(outputDir, `${n}.opus`), file);

    totalSecs.push(pcm.length / sampleRate);
    console.log(
      `${lang.code}/${n}.opus  "${name}"  ${totalSecs[n].toFixed(2)}s`,
    );
  }

  fs.rmSync(tmpDir, {force: true, recursive: true});
  const avgSecs = totalSecs.reduce((a, b) => a + b, 0) / totalSecs.length;
  console.log(
    `\n[${lang.code}] Generated ${totalSecs.length} voice clips (avg ${avgSecs.toFixed(2)}s) to ${outputDir}`,
  );
}

// --- Chimes (procedural tones) ---

function synthesizeChime(sampleRate, duration, tones) {
  const samples = new Float32Array(Math.floor(sampleRate * duration));
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    let val = 0;
    for (const {freq, delaySec, decay, gain} of tones) {
      if (t >= delaySec) {
        const dt = t - delaySec;
        val += Math.sin(2 * Math.PI * freq * dt) * Math.exp(-dt * decay) * gain;
      }
    }
    samples[i] = val;
  }
  return samples;
}

async function generateChimes() {
  for (const file of fs.readdirSync(PUBLIC_AUDIO_DIR)) {
    if (file.endsWith('.wav')) fs.unlinkSync(path.join(PUBLIC_AUDIO_DIR, file));
  }

  // Original recipes: beep / two-tone start / four-note finish chord
  const chimes = [
    {
      duration: 0.15,
      name: 'beep',
      tones: [{decay: 15, delaySec: 0, freq: 880, gain: 0.5}],
    },
    {
      duration: 0.4,
      name: 'start',
      tones: [
        {decay: 6, delaySec: 0, freq: 523.25, gain: 0.3},
        {decay: 6, delaySec: 0.05, freq: 783.99, gain: 0.3},
      ],
    },
    {
      duration: 0.8,
      name: 'finish',
      tones: [
        {decay: 4, delaySec: 0, freq: 523.25, gain: 0.25},
        {decay: 4, delaySec: 0.08, freq: 659.25, gain: 0.25},
        {decay: 4, delaySec: 0.16, freq: 783.99, gain: 0.25},
        {decay: 4, delaySec: 0.24, freq: 1046.5, gain: 0.25},
      ],
    },
  ];
  for (const {name, duration, tones} of chimes) {
    const samples = synthesizeChime(VOICE_SAMPLE_RATE, duration, tones);
    const file = await encodeOggOpus([samples], VOICE_SAMPLE_RATE, 48, 'audio');
    fs.writeFileSync(path.join(PUBLIC_AUDIO_DIR, `${name}.opus`), file);
    console.log(`${name}.opus  ${duration.toFixed(2)}s  ${file.length} bytes`);
  }
}

// ---

const [scope, langArg] = process.argv.slice(2);
if (scope && !['voices', 'chimes'].includes(scope)) {
  console.error(
    'Usage: node scripts/generate-audio.js [voices|chimes] [lang-code]  (no arg = both, all languages)',
  );
  process.exit(1);
}

const langs = langArg
  ? LANGUAGES.filter((lang) => lang.code === langArg)
  : LANGUAGES;
if (langArg && langs.length === 0) {
  console.error(
    `Unknown language: ${langArg} (known: ${LANGUAGES.map((lang) => lang.code).join(', ')})`,
  );
  process.exit(1);
}

if (!scope || scope === 'voices')
  for (const lang of langs) await generateVoices(lang);
if (!scope || scope === 'chimes') await generateChimes();

const fs = require('fs');

function createWavFile(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * blockAlign;
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  
  // "RIFF" chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  buffer.write('data', 38);
  buffer.writeUInt32LE(dataSize, 42);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(val), 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;

// 1. Beep: 880 Hz sine wave, 0.15s with exponential decay
const beepDuration = 0.15;
const beepSamples = new Float32Array(Math.floor(sampleRate * beepDuration));
for (let i = 0; i < beepSamples.length; i++) {
  const t = i / sampleRate;
  const env = Math.exp(-t * 15);
  beepSamples[i] = Math.sin(2 * Math.PI * 880 * t) * env * 0.5;
}
fs.writeFileSync('/app/applet/public/audio/beep.wav', createWavFile(beepSamples));

// 2. Start: two tones ascending (523.25 Hz, 783.99 Hz)
const startDuration = 0.4;
const startSamples = new Float32Array(Math.floor(sampleRate * startDuration));
const startFreqs = [523.25, 783.99];
for (let i = 0; i < startSamples.length; i++) {
  const t = i / sampleRate;
  let val = 0;
  startFreqs.forEach((freq, idx) => {
    const offset = idx * 0.05;
    if (t >= offset) {
      const dt = t - offset;
      const env = Math.exp(-dt * 6);
      val += Math.sin(2 * Math.PI * freq * dt) * env * 0.3;
    }
  });
  startSamples[i] = val;
}
fs.writeFileSync('/app/applet/public/audio/start.wav', createWavFile(startSamples));

// 3. Finish: 4 chord tones (523.25, 659.25, 783.99, 1046.5)
const finishDuration = 0.8;
const finishSamples = new Float32Array(Math.floor(sampleRate * finishDuration));
const finishFreqs = [523.25, 659.25, 783.99, 1046.5];
for (let i = 0; i < finishSamples.length; i++) {
  const t = i / sampleRate;
  let val = 0;
  finishFreqs.forEach((freq, idx) => {
    const offset = idx * 0.08;
    if (t >= offset) {
      const dt = t - offset;
      const env = Math.exp(-dt * 4);
      val += Math.sin(2 * Math.PI * freq * dt) * env * 0.25;
    }
  });
  finishSamples[i] = val;
}
fs.writeFileSync('/app/applet/public/audio/finish.wav', createWavFile(finishSamples));

console.log('Chime WAV files generated successfully.');

import fs from 'fs'
import path from 'path'

const SAMPLE_RATE = 44100

function clamp(v, min = -1, max = 1) {
  return Math.max(min, Math.min(max, v))
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function createBuffer(durationSec) {
  return new Float32Array(Math.floor(durationSec * SAMPLE_RATE))
}

function addTone(buffer, {
  start = 0,
  duration,
  freqStart,
  freqEnd = freqStart,
  gain = 0.2,
  type = 'sine',
  attack = 0.005,
  release = 0.05,
  panPhase = 0,
}) {
  const startIndex = Math.floor(start * SAMPLE_RATE)
  const sampleCount = Math.floor(duration * SAMPLE_RATE)
  let phase = panPhase

  for (let i = 0; i < sampleCount; i += 1) {
    const idx = startIndex + i
    if (idx >= buffer.length) break

    const t = i / SAMPLE_RATE
    const progress = sampleCount <= 1 ? 1 : i / (sampleCount - 1)
    const freq = freqStart + (freqEnd - freqStart) * progress
    phase += (2 * Math.PI * freq) / SAMPLE_RATE

    let osc = 0
    if (type === 'triangle') {
      osc = (2 / Math.PI) * Math.asin(Math.sin(phase))
    } else if (type === 'square') {
      osc = Math.sign(Math.sin(phase))
    } else if (type === 'soft-saw') {
      const saw = 2 * ((phase / (2 * Math.PI)) % 1) - 1
      osc = saw * 0.5 + Math.sin(phase) * 0.5
    } else {
      osc = Math.sin(phase)
    }

    const attackEnv = attack <= 0 ? 1 : smoothstep(0, attack, t)
    const releaseStart = Math.max(duration - release, 0)
    const releaseEnv = release <= 0 ? 1 : 1 - smoothstep(releaseStart, duration, t)
    const env = attackEnv * releaseEnv

    buffer[idx] += osc * gain * env
  }
}

function addNoise(buffer, {
  start = 0,
  duration,
  gain = 0.06,
  attack = 0.001,
  release = 0.04,
  color = 'white',
}) {
  const startIndex = Math.floor(start * SAMPLE_RATE)
  const sampleCount = Math.floor(duration * SAMPLE_RATE)
  let last = 0

  for (let i = 0; i < sampleCount; i += 1) {
    const idx = startIndex + i
    if (idx >= buffer.length) break

    const t = i / SAMPLE_RATE
    const attackEnv = attack <= 0 ? 1 : smoothstep(0, attack, t)
    const releaseStart = Math.max(duration - release, 0)
    const releaseEnv = release <= 0 ? 1 : 1 - smoothstep(releaseStart, duration, t)
    const env = attackEnv * releaseEnv

    let noise = Math.random() * 2 - 1
    if (color === 'pink') {
      last = last * 0.82 + noise * 0.18
      noise = last
    } else if (color === 'soft') {
      last = last * 0.9 + noise * 0.1
      noise = last * 0.8 + noise * 0.2
    }

    buffer[idx] += noise * gain * env
  }
}

function addChime(buffer, start, freq, duration, gain) {
  addTone(buffer, { start, duration, freqStart: freq, freqEnd: freq * 0.996, gain: gain * 0.75, type: 'sine', attack: 0.002, release: duration * 0.82 })
  addTone(buffer, { start, duration, freqStart: freq * 2, freqEnd: freq * 1.98, gain: gain * 0.28, type: 'triangle', attack: 0.001, release: duration * 0.7 })
  addTone(buffer, { start, duration, freqStart: freq * 3.01, freqEnd: freq * 2.96, gain: gain * 0.14, type: 'sine', attack: 0.001, release: duration * 0.58 })
}

function lowpassInPlace(buffer, alpha = 0.12) {
  let prev = 0
  for (let i = 0; i < buffer.length; i += 1) {
    prev += alpha * (buffer[i] - prev)
    buffer[i] = prev
  }
}

function normalize(buffer, targetPeak = 0.9) {
  let peak = 0
  for (let i = 0; i < buffer.length; i += 1) {
    peak = Math.max(peak, Math.abs(buffer[i]))
  }
  if (peak <= 0.00001) return
  const scale = targetPeak / peak
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] *= scale
  }
}

function writeWav(filePath, samples) {
  const numChannels = 1
  const bitsPerSample = 16
  const blockAlign = (numChannels * bitsPerSample) / 8
  const byteRate = SAMPLE_RATE * blockAlign
  const dataSize = samples.length * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.round(clamp(samples[i]) * 32767)
    buffer.writeInt16LE(sample, 44 + i * 2)
  }

  fs.writeFileSync(filePath, buffer)
}

function makeShoot() {
  const buffer = createBuffer(0.36)
  addTone(buffer, { start: 0, duration: 0.26, freqStart: 760, freqEnd: 560, gain: 0.14, type: 'sine', attack: 0.008, release: 0.2 })
  addTone(buffer, { start: 0.018, duration: 0.18, freqStart: 980, freqEnd: 720, gain: 0.03, type: 'sine', attack: 0.006, release: 0.13 })
  addTone(buffer, { start: 0.01, duration: 0.11, freqStart: 520, freqEnd: 440, gain: 0.02, type: 'triangle', attack: 0.004, release: 0.08 })
  addNoise(buffer, { start: 0, duration: 0.02, gain: 0.003, attack: 0.003, release: 0.015, color: 'soft' })
  lowpassInPlace(buffer, 0.14)
  normalize(buffer, 0.72)
  return buffer
}

function makeMerge() {
  const buffer = createBuffer(0.12)
  addTone(buffer, { start: 0, duration: 0.11, freqStart: 980, freqEnd: 720, gain: 0.18, type: 'sine', attack: 0.003, release: 0.085 })
  addTone(buffer, { start: 0.008, duration: 0.075, freqStart: 1320, freqEnd: 980, gain: 0.04, type: 'sine', attack: 0.002, release: 0.05 })
  addTone(buffer, { start: 0.005, duration: 0.06, freqStart: 520, freqEnd: 460, gain: 0.018, type: 'triangle', attack: 0.002, release: 0.04 })
  addNoise(buffer, { start: 0, duration: 0.018, gain: 0.0025, attack: 0.002, release: 0.012, color: 'soft' })
  lowpassInPlace(buffer, 0.16)
  normalize(buffer, 0.74)
  return buffer
}

function makeGameOver() {
  const buffer = createBuffer(1.12)
  addChime(buffer, 0, 440, 0.42, 0.18)
  addChime(buffer, 0.2, 349.23, 0.48, 0.16)
  addChime(buffer, 0.45, 293.66, 0.56, 0.18)
  addTone(buffer, { start: 0, duration: 1.0, freqStart: 196, freqEnd: 174.61, gain: 0.06, type: 'triangle', attack: 0.01, release: 0.35 })
  addNoise(buffer, { start: 0, duration: 0.12, gain: 0.012, attack: 0.001, release: 0.08, color: 'soft' })
  lowpassInPlace(buffer, 0.16)
  normalize(buffer, 0.84)
  return buffer
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function makeBgm() {
  const bpm = 92
  const beat = 60 / bpm
  const bars = 16
  const beatsPerBar = 4
  const duration = bars * beatsPerBar * beat
  const buffer = createBuffer(duration)

  const progression = [
    [57, 61, 64],
    [54, 57, 61],
    [52, 56, 59],
    [50, 54, 57],
  ]
  const motif = [0, 2, 1, 2, 0, 2, 1, 2]

  for (let bar = 0; bar < bars; bar += 1) {
    const chord = progression[bar % progression.length]
    const barStart = bar * beatsPerBar * beat

    addTone(buffer, {
      start: barStart,
      duration: beatsPerBar * beat,
      freqStart: midiToFreq(chord[0] - 12),
      gain: 0.035,
      type: 'triangle',
      attack: 0.04,
      release: 0.22,
    })
    addTone(buffer, {
      start: barStart,
      duration: beatsPerBar * beat,
      freqStart: midiToFreq(chord[1] - 12),
      gain: 0.02,
      type: 'sine',
      attack: 0.05,
      release: 0.24,
    })

    for (let step = 0; step < 8; step += 1) {
      const note = chord[motif[step]]
      const start = barStart + step * beat * 0.5
      addChime(buffer, start, midiToFreq(note + 12), beat * 0.42, 0.065)
    }

    const topNote = bar % 2 === 0 ? chord[2] + 12 : chord[1] + 12
    addTone(buffer, {
      start: barStart + beat,
      duration: beat * 1.3,
      freqStart: midiToFreq(topNote),
      freqEnd: midiToFreq(topNote) * 0.998,
      gain: 0.024,
      type: 'sine',
      attack: 0.03,
      release: 0.24,
    })
  }

  lowpassInPlace(buffer, 0.18)
  normalize(buffer, 0.72)
  return buffer
}

const outDir = path.resolve('public/audio')
fs.mkdirSync(outDir, { recursive: true })

const files = [
  ['shoot.wav', makeShoot()],
  ['merge.wav', makeMerge()],
  ['game-over.wav', makeGameOver()],
  ['garden-bgm-loop.wav', makeBgm()],
]

for (const [name, data] of files) {
  writeWav(path.join(outDir, name), data)
}

console.log('Generated audio files:')
for (const [name] of files) {
  const full = path.join(outDir, name)
  const stat = fs.statSync(full)
  console.log(`${name} ${stat.size} bytes`)
}

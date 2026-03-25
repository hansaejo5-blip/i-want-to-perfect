const PUBLIC_BASE_URL = import.meta.env.BASE_URL
const SHOOT_AUDIO_URL = `${PUBLIC_BASE_URL}audio/shoot.wav`
const MERGE_AUDIO_URL = `${PUBLIC_BASE_URL}audio/merge.wav`
const GAME_OVER_AUDIO_URL = `${PUBLIC_BASE_URL}audio/game-over.wav`
const BGM_AUDIO_URL = `${PUBLIC_BASE_URL}audio/garden-bgm-loop.wav`

const DREAM_CHORDS = [
  [220.0, 277.18, 329.63, 440.0],
  [196.0, 246.94, 293.66, 392.0],
  [174.61, 220.0, 261.63, 349.23],
  [233.08, 293.66, 349.23, 466.16],
] as const

export interface GameAudioController {
  unlock: () => void
  setMuted: (muted: boolean) => void
  playShoot: () => void
  playMerge: () => void
  playGameOver: () => void
  destroy: () => void
}

type PadLayer = {
  master: GainNode
  filter: BiquadFilterNode
  voiceA: OscillatorNode
  voiceB: OscillatorNode
  voiceC: OscillatorNode
  voiceD: OscillatorNode
}

type BgmChain = {
  context: AudioContext
  source: MediaElementAudioSourceNode
  lowpass: BiquadFilterNode
  presence: BiquadFilterNode
  air: BiquadFilterNode
  wetGain: GainNode
  delay: DelayNode
  feedback: GainNode
  compressor: DynamicsCompressorNode
  gain: GainNode
  pad: PadLayer
}

function configureSfx(audio: HTMLAudioElement, volume: number) {
  audio.preload = 'auto'
  audio.volume = volume
}

function setPadChord(pad: PadLayer, chord: readonly number[], now: number) {
  pad.voiceA.frequency.setTargetAtTime(chord[0], now, 2.8)
  pad.voiceB.frequency.setTargetAtTime(chord[1], now, 3.1)
  pad.voiceC.frequency.setTargetAtTime(chord[2], now, 2.9)
  pad.voiceD.frequency.setTargetAtTime(chord[3], now, 3.4)
}

function createPadLayer(context: AudioContext, compressor: DynamicsCompressorNode): PadLayer {
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1040
  filter.Q.value = 0.55

  const master = context.createGain()
  master.gain.value = 0

  const createVoice = (type: OscillatorType, gainValue: number) => {
    const oscillator = context.createOscillator()
    oscillator.type = type
    const gain = context.createGain()
    gain.gain.value = gainValue
    oscillator.connect(gain)
    gain.connect(filter)
    oscillator.start()
    return oscillator
  }

  const voiceA = createVoice('sine', 0.018)
  const voiceB = createVoice('triangle', 0.013)
  const voiceC = createVoice('sine', 0.01)
  const voiceD = createVoice('triangle', 0.008)

  filter.connect(master)
  master.connect(compressor)

  return {
    master,
    filter,
    voiceA,
    voiceB,
    voiceC,
    voiceD,
  }
}

function stopPadLayer(pad: PadLayer) {
  pad.voiceA.stop()
  pad.voiceB.stop()
  pad.voiceC.stop()
  pad.voiceD.stop()
}

function createBgmChain(bgm: HTMLAudioElement): BgmChain | null {
  const AudioContextCtor = window.AudioContext ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) {
    return null
  }

  try {
    const context = new AudioContextCtor()
    const source = context.createMediaElementSource(bgm)

    const lowpass = context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 1600
    lowpass.Q.value = 0.62

    const presence = context.createBiquadFilter()
    presence.type = 'peaking'
    presence.frequency.value = 680
    presence.Q.value = 0.8
    presence.gain.value = 1.18

    const air = context.createBiquadFilter()
    air.type = 'highshelf'
    air.frequency.value = 2400
    air.gain.value = 1.08

    const dryGain = context.createGain()
    dryGain.gain.value = 0.94

    const wetGain = context.createGain()
    wetGain.gain.value = 0.078

    const delay = context.createDelay(0.7)
    delay.delayTime.value = 0.248

    const feedback = context.createGain()
    feedback.gain.value = 0.145

    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 18
    compressor.ratio.value = 2.15
    compressor.attack.value = 0.03
    compressor.release.value = 0.24

    const gain = context.createGain()
    gain.gain.value = 0.83

    const pad = createPadLayer(context, compressor)

    source.connect(lowpass)
    lowpass.connect(presence)
    presence.connect(air)

    air.connect(dryGain)
    dryGain.connect(compressor)

    air.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    wetGain.connect(compressor)

    compressor.connect(gain)
    gain.connect(context.destination)

    return {
      context,
      source,
      lowpass,
      presence,
      air,
      wetGain,
      delay,
      feedback,
      compressor,
      gain,
      pad,
    }
  } catch {
    return null
  }
}

export function createGameAudioController(): GameAudioController {
  const bgm = new Audio(BGM_AUDIO_URL)
  bgm.loop = true
  bgm.preload = 'auto'
  bgm.volume = 0.225
  bgm.playbackRate = 0.978

  const bgmChain = createBgmChain(bgm)

  const shoot = new Audio(SHOOT_AUDIO_URL)
  const merge = new Audio(MERGE_AUDIO_URL)
  const gameOver = new Audio(GAME_OVER_AUDIO_URL)
  configureSfx(shoot, 0.55)
  configureSfx(merge, 0.48)
  configureSfx(gameOver, 0.58)

  let isMuted = false
  let isUnlocked = false
  let bgmStarted = false
  let bgmVariationTimer: number | null = null
  let bgmSectionTimer: number | null = null
  let sectionIndex = 0

  const applyDreamVariation = () => {
    if (bgmChain === null) {
      return
    }

    const now = bgmChain.context.currentTime
    const bloomA = Math.sin(now * 0.17)
    const bloomB = Math.sin(now * 0.11 + 1.7)
    const bloomC = Math.sin(now * 0.07 + 3.2)

    bgm.playbackRate = 0.978 + bloomA * 0.002 + bloomC * 0.0012
    bgmChain.lowpass.frequency.setTargetAtTime(1600 + bloomA * 110 + bloomB * 70, now, 1.9)
    bgmChain.presence.gain.setTargetAtTime(1.18 + bloomB * 0.22, now, 1.9)
    bgmChain.air.gain.setTargetAtTime(1.08 + bloomC * 0.26, now, 2.4)
    bgmChain.delay.delayTime.setTargetAtTime(0.248 + bloomB * 0.013, now, 2.8)
    bgmChain.feedback.gain.setTargetAtTime(0.145 + bloomA * 0.018, now, 2.8)
    bgmChain.wetGain.gain.setTargetAtTime(0.078 + bloomC * 0.014, now, 2.6)
    bgmChain.gain.gain.setTargetAtTime(0.83 + bloomA * 0.014, now, 2.2)
    bgmChain.pad.master.gain.setTargetAtTime(0.018 + Math.max(0, bloomB) * 0.014, now, 3.4)
    bgmChain.pad.filter.frequency.setTargetAtTime(980 + sectionIndex * 70 + bloomC * 90, now, 3.6)
  }

  const advanceDreamSection = () => {
    if (bgmChain === null) {
      return
    }

    sectionIndex = (sectionIndex + 1) % DREAM_CHORDS.length
    const now = bgmChain.context.currentTime
    setPadChord(bgmChain.pad, DREAM_CHORDS[sectionIndex], now)
    bgmChain.pad.master.gain.setTargetAtTime(0.018 + (sectionIndex % 2 === 0 ? 0.014 : 0.009), now, 4.6)
    bgmChain.pad.filter.frequency.setTargetAtTime(980 + sectionIndex * 70, now, 4.2)
  }

  const stopVariationTimers = () => {
    if (bgmVariationTimer !== null) {
      window.clearInterval(bgmVariationTimer)
      bgmVariationTimer = null
    }

    if (bgmSectionTimer !== null) {
      window.clearInterval(bgmSectionTimer)
      bgmSectionTimer = null
    }
  }

  const startVariationTimers = () => {
    if (bgmChain === null) {
      return
    }

    if (bgmVariationTimer === null) {
      applyDreamVariation()
      bgmVariationTimer = window.setInterval(applyDreamVariation, 3200)
    }

    if (bgmSectionTimer === null) {
      setPadChord(bgmChain.pad, DREAM_CHORDS[sectionIndex], bgmChain.context.currentTime)
      advanceDreamSection()
      bgmSectionTimer = window.setInterval(advanceDreamSection, 18000)
    }
  }

  const startBgm = () => {
    if (isMuted || bgmStarted === true) {
      return
    }

    const resumeContext = bgmChain === null || bgmChain.context.state === 'running'
      ? Promise.resolve()
      : bgmChain.context.resume().catch(() => undefined)

    void resumeContext.then(() => bgm.play()).then(() => {
      bgmStarted = true
      startVariationTimers()
    }).catch(() => {
      bgmStarted = false
    })
  }

  const playOneShot = (source: HTMLAudioElement) => {
    if (isMuted) {
      return
    }

    const instance = source.cloneNode(true) as HTMLAudioElement
    instance.volume = source.volume
    void instance.play().catch(() => {
      // Ignore blocked or interrupted playback.
    })
  }

  return {
    unlock() {
      isUnlocked = true
      startBgm()
    },
    setMuted(muted: boolean) {
      isMuted = muted
      bgm.muted = muted
      shoot.muted = muted
      merge.muted = muted
      gameOver.muted = muted

      if (muted) {
        bgm.pause()
        bgmStarted = false
        stopVariationTimers()
        return
      }

      if (isUnlocked) {
        startBgm()
      }
    },
    playShoot() {
      if (isUnlocked === false) {
        return
      }
      playOneShot(shoot)
    },
    playMerge() {
      if (isUnlocked === false) {
        return
      }
      playOneShot(merge)
    },
    playGameOver() {
      if (isUnlocked === false) {
        return
      }
      bgm.pause()
      bgm.currentTime = 0
      bgmStarted = false
      stopVariationTimers()
      playOneShot(gameOver)
    },
    destroy() {
      bgm.pause()
      bgm.currentTime = 0
      stopVariationTimers()
      if (bgmChain !== null) {
        stopPadLayer(bgmChain.pad)
      }
      void bgmChain?.context.close().catch(() => undefined)
    },
  }
}

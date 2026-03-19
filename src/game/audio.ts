const SHOOT_AUDIO_URL = '/audio/shoot.wav'
const MERGE_AUDIO_URL = '/audio/merge.wav'
const GAME_OVER_AUDIO_URL = '/audio/game-over.wav'
const BGM_AUDIO_URL = '/audio/garden-bgm-loop.wav'

export interface GameAudioController {
  unlock: () => void
  setMuted: (muted: boolean) => void
  playShoot: () => void
  playMerge: () => void
  playGameOver: () => void
  destroy: () => void
}

function configureSfx(audio: HTMLAudioElement, volume: number) {
  audio.preload = 'auto'
  audio.volume = volume
}

export function createGameAudioController(): GameAudioController {
  const bgm = new Audio(BGM_AUDIO_URL)
  bgm.loop = true
  bgm.preload = 'auto'
  bgm.volume = 0.3

  const shoot = new Audio(SHOOT_AUDIO_URL)
  const merge = new Audio(MERGE_AUDIO_URL)
  const gameOver = new Audio(GAME_OVER_AUDIO_URL)
  configureSfx(shoot, 0.55)
  configureSfx(merge, 0.48)
  configureSfx(gameOver, 0.58)

  let isMuted = false
  let isUnlocked = false
  let bgmStarted = false

  const startBgm = () => {
    if (isMuted || bgmStarted === true) {
      return
    }

    void bgm.play().then(() => {
      bgmStarted = true
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
      playOneShot(gameOver)
    },
    destroy() {
      bgm.pause()
      bgm.currentTime = 0
    },
  }
}

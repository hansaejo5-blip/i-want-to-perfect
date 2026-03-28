import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CANNON_X, CANNON_Y, WORLD_HEIGHT, WORLD_WIDTH } from './config'
import { createGameAudioController } from './audio'
import { createGame } from './createGame'
import { createInitialGameSnapshot } from './state/gameState'
import type { GameSnapshot } from './types'
import { GameOverlay } from './ui/GameOverlay'
import type { RunEndedSummary } from './stats'

type GameScreenProps = {
  isMuted?: boolean
  onRunEnded?: (summary: RunEndedSummary) => void
  autoEnterFullscreenSignal?: number
  backgroundGradient?: [string, string]
  skinVariant?: 'classic' | 'dewdrop'
}

type ScreenOrientationApi = {
  lock?: (orientation: 'landscape' | 'portrait') => Promise<void>
  unlock?: () => void
}

function FullscreenIcon({ isFullscreen }: { isFullscreen: boolean }) {
  if (isFullscreen) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4H5a1 1 0 0 0-1 1v3h2V6h2V4Zm10 0h-3v2h2v2h2V5a1 1 0 0 0-1-1ZM6 15H4v4a1 1 0 0 0 1 1h4v-2H6v-3Zm12 3h-3v2h4a1 1 0 0 0 1-1v-4h-2v3Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V5a1 1 0 0 1 1-1h4v2H6v3H4Zm10-5h5a1 1 0 0 1 1 1v4h-2V6h-4V4ZM4 15h2v3h3v2H5a1 1 0 0 1-1-1v-4Zm14 3v-3h2v4a1 1 0 0 1-1 1h-4v-2h3Z" />
    </svg>
  )
}

function isMobileDevice() {
  return window.matchMedia('(max-width: 960px) and (pointer: coarse)').matches
}

async function lockLandscapeOrientation() {
  if (isMobileDevice() === false) {
    return
  }

  const orientation = screen.orientation as ScreenOrientationApi | undefined
  if (!orientation?.lock) {
    return
  }

  try {
    await orientation.lock('landscape')
  } catch {
    // Ignore browsers that do not allow programmatic orientation locking.
  }
}

function unlockOrientation() {
  const orientation = screen.orientation as ScreenOrientationApi | undefined

  try {
    orientation?.unlock?.()
  } catch {
    // Ignore browsers that do not expose unlock support.
  }
}

export function GameScreen({
  isMuted = false,
  onRunEnded,
  autoEnterFullscreenSignal = 0,
  backgroundGradient,
  skinVariant = 'classic',
}: GameScreenProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)
  const hasReportedRunEndRef = useRef(false)
  const scheduledLayoutFrameRef = useRef<number | null>(null)
  const delayedLayoutTimeoutRef = useRef<number | null>(null)
  const syncLayoutRef = useRef<() => void>(() => {})
  const hasAttemptedAutoFullscreenRef = useRef(false)
  const [sessionId, setSessionId] = useState(0)
  const [snapshot, setSnapshot] = useState<GameSnapshot>(
    createInitialGameSnapshot(),
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => isMobileDevice())
  const [audio] = useState(() => createGameAudioController())

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 960px) and (pointer: coarse)')
    const updateMobileState = () => {
      setIsMobile(mediaQuery.matches)
    }

    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)

    return () => {
      mediaQuery.removeEventListener('change', updateMobileState)
    }
  }, [])

  useEffect(() => {
    const frame = frameRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current

    if (!frame || !stage || !canvas) {
      return
    }

    const game = createGame({
      canvas,
      onStateChange: setSnapshot,
      onShoot: () => audio.playShoot(),
      onMerge: () => audio.playMerge(),
      onGameOver: () => audio.playGameOver(),
      theme: {
        backgroundGradient,
        skinVariant,
      },
    })

    gameRef.current = game

    const updateLayout = () => {
      const rect = frame.getBoundingClientRect()
      const availableWidth = Math.max(1, rect.width)
      const availableHeight = Math.max(1, rect.height)
      const scale = Math.min(availableWidth / WORLD_WIDTH, availableHeight / WORLD_HEIGHT)
      const stageWidth = Math.max(1, Math.round(WORLD_WIDTH * scale))
      const stageHeight = Math.max(1, Math.round(WORLD_HEIGHT * scale))

      stage.style.width = `${stageWidth}px`
      stage.style.height = `${stageHeight}px`
      game.resize(stageWidth, stageHeight)
    }

    const syncLayout = () => {
      updateLayout()

      if (scheduledLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(scheduledLayoutFrameRef.current)
      }
      scheduledLayoutFrameRef.current = window.requestAnimationFrame(() => {
        updateLayout()
        scheduledLayoutFrameRef.current = null
      })

      if (delayedLayoutTimeoutRef.current !== null) {
        window.clearTimeout(delayedLayoutTimeoutRef.current)
      }
      delayedLayoutTimeoutRef.current = window.setTimeout(() => {
        updateLayout()
        delayedLayoutTimeoutRef.current = null
      }, 220)
    }

    syncLayoutRef.current = syncLayout
    syncLayout()

    const resizeObserver = new ResizeObserver(() => {
      syncLayout()
    })

    const handleWindowResize = () => {
      syncLayout()
    }

    resizeObserver.observe(frame)
    window.addEventListener('resize', handleWindowResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      if (scheduledLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(scheduledLayoutFrameRef.current)
        scheduledLayoutFrameRef.current = null
      }
      if (delayedLayoutTimeoutRef.current !== null) {
        window.clearTimeout(delayedLayoutTimeoutRef.current)
        delayedLayoutTimeoutRef.current = null
      }
      syncLayoutRef.current = () => {}
      game.destroy()
      gameRef.current = null
    }
  }, [audio, backgroundGradient, sessionId, skinVariant])

  useEffect(() => {
    audio.setMuted(isMuted)
  }, [audio, isMuted])

  useEffect(() => {
    if (snapshot.isGameOver === false) {
      hasReportedRunEndRef.current = false
      return
    }

    if (hasReportedRunEndRef.current) {
      return
    }

    hasReportedRunEndRef.current = true
    onRunEnded?.({
      score: snapshot.score,
      bestScore: snapshot.bestScore,
      shotCount: snapshot.shotCount,
      mergeCount: snapshot.mergeCount,
      maxCombo: snapshot.maxCombo,
    })
  }, [onRunEnded, snapshot.bestScore, snapshot.isGameOver, snapshot.maxCombo, snapshot.mergeCount, snapshot.score, snapshot.shotCount])

  useEffect(() => {
    return () => {
      unlockOrientation()
      audio.destroy()
    }
  }, [audio])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFrameFullscreen = document.fullscreenElement === frameRef.current
      setIsFullscreen(isCurrentFrameFullscreen)

      if (isCurrentFrameFullscreen) {
        void lockLandscapeOrientation()
      } else {
        unlockOrientation()
      }

      syncLayoutRef.current()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    handleFullscreenChange()

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    if (document.fullscreenElement === frame) {
      await document.exitFullscreen()
      unlockOrientation()
      syncLayoutRef.current()
      return
    }

    await frame.requestFullscreen()
    await lockLandscapeOrientation()
    syncLayoutRef.current()
  }

  useLayoutEffect(() => {
    if (!isMobile || autoEnterFullscreenSignal === 0 || hasAttemptedAutoFullscreenRef.current) {
      return
    }

    hasAttemptedAutoFullscreenRef.current = true
    void toggleFullscreen()
  }, [autoEnterFullscreenSignal, isMobile])

  const showDragHint = snapshot.shotCount === 0 && snapshot.isGameOver === false
  const dragHintStyle = {
    left: `${(CANNON_X / WORLD_WIDTH) * 100}%`,
    top: `${((CANNON_Y - 120) / WORLD_HEIGHT) * 100}%`,
  }

  return (
    <section className="game-screen">
      {isMobile && !isFullscreen ? (
        <button
          className="mobile-fullscreen-cta"
          type="button"
          onClick={() => void toggleFullscreen()}
        >
          <FullscreenIcon isFullscreen={false} />
          <span>Open Fullscreen</span>
        </button>
      ) : null}
      <div
        className={`game-frame${isMobile ? ' game-frame--mobile' : ''}${isMobile && !isFullscreen ? ' game-frame--mobile-ready' : ''}`}
        ref={frameRef}
      >
        <div className="game-stage" ref={stageRef}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            onPointerDown={(event) => {
              audio.unlock()
              event.currentTarget.setPointerCapture(event.pointerId)
              gameRef.current?.pointerDown(event.clientX, event.clientY)
            }}
            onPointerMove={(event) => {
              gameRef.current?.pointerMove(event.clientX, event.clientY)
            }}
            onPointerUp={(event) => {
              audio.unlock()
              gameRef.current?.pointerUp(event.clientX, event.clientY)
            }}
            onPointerCancel={(event) => {
              gameRef.current?.pointerCancel(event.clientX, event.clientY)
            }}
          />
          <GameOverlay
            snapshot={snapshot}
            showMobileFullscreenHint={isMobile && !isFullscreen}
            onRestart={() => {
              setSnapshot(createInitialGameSnapshot(snapshot.bestScore))
              setSessionId((current) => current + 1)
            }}
          />
          {showDragHint ? (
            <div className="drag-hint" style={dragHintStyle}>
              <span className="drag-hint__label">drag!</span>
              <span className="drag-hint__arrow" aria-hidden="true" />
            </div>
          ) : null}
        </div>
        <button
          className="fullscreen-button"
          type="button"
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <FullscreenIcon isFullscreen={isFullscreen} />
          {isMobile && !isFullscreen ? <span className="fullscreen-button__text">Fullscreen</span> : null}
        </button>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createGameAudioController } from './audio'
import { createGame } from './createGame'
import { createInitialGameSnapshot } from './state/gameState'
import type { GameSnapshot } from './types'
import { GameOverlay } from './ui/GameOverlay'
import type { RunEndedSummary } from './stats'

type GameScreenProps = {
  isMuted?: boolean
  onRunEnded?: (summary: RunEndedSummary) => void
}

export function GameScreen({ isMuted = false, onRunEnded }: GameScreenProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)
  const audioRef = useRef<ReturnType<typeof createGameAudioController> | null>(null)
  const hasReportedRunEndRef = useRef(false)
  const [sessionId, setSessionId] = useState(0)
  const [snapshot, setSnapshot] = useState<GameSnapshot>(
    createInitialGameSnapshot(),
  )
  const [isLandscape, setIsLandscape] = useState(() => {
    return window.innerWidth >= window.innerHeight
  })

  if (audioRef.current === null) {
    audioRef.current = createGameAudioController()
  }

  const audio = audioRef.current

  useEffect(() => {
    const frame = frameRef.current
    const canvas = canvasRef.current

    if (!frame || !canvas) {
      return
    }

    const game = createGame({
      canvas,
      onStateChange: setSnapshot,
      onShoot: () => audio.playShoot(),
      onMerge: () => audio.playMerge(),
      onGameOver: () => audio.playGameOver(),
    })

    gameRef.current = game

    const updateLayout = () => {
      const nextLandscape = window.innerWidth >= window.innerHeight
      setIsLandscape(nextLandscape)
      const rect = frame.getBoundingClientRect()
      game.resize(rect.width, rect.height)
    }

    updateLayout()

    const resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })

    const handleWindowResize = () => {
      updateLayout()
    }

    resizeObserver.observe(frame)
    window.addEventListener('resize', handleWindowResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      game.destroy()
      gameRef.current = null
    }
  }, [audio, sessionId])

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
    })
  }, [onRunEnded, snapshot.bestScore, snapshot.isGameOver, snapshot.score, snapshot.shotCount])

  useEffect(() => {
    return () => {
      audio.destroy()
    }
  }, [audio])

  return (
    <section className="game-screen">
      <div className="game-frame" ref={frameRef}>
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onPointerDown={(event) => {
            if (isLandscape === false) {
              return
            }
            audio.unlock()
            event.currentTarget.setPointerCapture(event.pointerId)
            gameRef.current?.pointerDown(event.clientX, event.clientY)
          }}
          onPointerMove={(event) => {
            if (isLandscape === false) {
              return
            }
            gameRef.current?.pointerMove(event.clientX, event.clientY)
          }}
          onPointerUp={(event) => {
            if (isLandscape === false) {
              return
            }
            audio.unlock()
            gameRef.current?.pointerUp(event.clientX, event.clientY)
          }}
          onPointerCancel={(event) => {
            if (isLandscape === false) {
              return
            }
            gameRef.current?.pointerCancel(event.clientX, event.clientY)
          }}
        />
        <GameOverlay
          snapshot={snapshot}
          isLandscape={isLandscape}
          onRestart={() => {
            setSnapshot(createInitialGameSnapshot(snapshot.bestScore))
            setSessionId((current) => current + 1)
          }}
        />
        {isLandscape === false ? (
          <div className="rotate-overlay">
            <strong>가로로 돌려주세요</strong>
            <span>Landscape orientation required</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}

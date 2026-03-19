import { getBallDefinition } from '../entities/fruits'
import type { GameSnapshot } from '../types'

interface GameOverlayProps {
  snapshot: GameSnapshot
  isLandscape: boolean
  onRestart: () => void
}

export function GameOverlay({
  snapshot,
  isLandscape,
  onRestart,
}: GameOverlayProps) {
  const secondsLeft = (snapshot.dangerTimeLeftMs / 1000).toFixed(1)
  const nextDefinition = getBallDefinition(snapshot.nextLevel)

  return (
    <div className="game-overlay">
      <div className="hud-topbar">
        <div className="hud-stack">
          <div className="hud-card hud-card--score">
            <span className="hud-label">Score</span>
            <strong>{snapshot.score}</strong>
          </div>
          <div className="hud-card">
            <span className="hud-label">Best</span>
            <strong>{snapshot.bestScore}</strong>
          </div>
          <div className="hud-card hud-card--danger">
            <span className="hud-label">Danger</span>
            <strong>{snapshot.isDangerActive ? secondsLeft + 's' : 'Calm'}</strong>
          </div>
          {snapshot.comboCount > 1 ? (
            <div className="hud-card hud-card--combo">
              <span className="hud-label">Bloom Chain</span>
              <strong>x{snapshot.comboCount}</strong>
            </div>
          ) : null}
        </div>

        <div className="hud-side">
          <div className="next-card">
            <div>
              <span className="hud-label">Next Bloom</span>
              <strong>{nextDefinition.name}</strong>
            </div>
            <div className="next-preview">
              <div
                className="next-ball"
                style={{
                  width: nextDefinition.radius * 1.5,
                  height: nextDefinition.radius * 1.5,
                  background: `radial-gradient(circle at 30% 28%, #fff8ef 0%, ${nextDefinition.accent} 28%, ${nextDefinition.fill} 62%, ${nextDefinition.stroke} 100%)`,
                  borderColor: nextDefinition.stroke,
                  boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.24), 0 8px 18px rgba(122,83,50,0.18)`,
                }}
              />
            </div>
          </div>
          <div className="guide-card">
            <span className="hud-label">Garden Bench</span>
            <strong>{isLandscape ? 'Landscape' : 'Rotate device'}</strong>
          </div>
        </div>
      </div>

      <div className="floor-counter">
        <span className="hud-label">Workbench</span>
        <strong>{snapshot.floorBallCount} / 3</strong>
      </div>

      {snapshot.isGameOver ? (
        <div className="gameover-panel">
          <div className="gameover-card">
            <span className="gameover-title">Garden Closed</span>
            <div className="gameover-stats">
              <div className="gameover-stat">
                <span className="hud-label">Score</span>
                <strong>{snapshot.score}</strong>
              </div>
              <div className="gameover-stat">
                <span className="hud-label">Best</span>
                <strong>{snapshot.bestScore}</strong>
              </div>
            </div>
            <button className="restart-button" onClick={onRestart} type="button">
              Replant
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

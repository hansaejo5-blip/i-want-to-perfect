import { DANGER_DURATION_MS, MIN_SHOT_POWER } from '../config'
import { getSpawnBallLevel } from '../entities/fruits'
import type { GameSnapshot } from '../types'

type Listener = (snapshot: GameSnapshot) => void

export function createInitialGameSnapshot(bestScore = 0): GameSnapshot {
  const currentLevel = getSpawnBallLevel(null)
  const nextLevel = getSpawnBallLevel(null)

  return {
    angleDeg: 0,
    shotPower: MIN_SHOT_POWER,
    shotCount: 0,
    score: 0,
    bestScore,
    comboCount: 0,
    mergeCount: 0,
    maxCombo: 0,
    currentLevel,
    nextLevel,
    floorBallCount: 0,
    isDangerActive: false,
    dangerTimeLeftMs: DANGER_DURATION_MS,
    isGameOver: false,
  }
}

export function createGameStateStore(initialState: GameSnapshot) {
  let snapshot = initialState
  const listeners = new Set<Listener>()

  return {
    getSnapshot() {
      return snapshot
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      listener(snapshot)

      return () => {
        listeners.delete(listener)
      }
    },
    update(partial: Partial<GameSnapshot>) {
      snapshot = {
        ...snapshot,
        ...partial,
      }

      for (const listener of listeners) {
        listener(snapshot)
      }
    },
  }
}

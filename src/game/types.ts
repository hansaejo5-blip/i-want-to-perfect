import type { Body as MatterBody } from 'matter-js'

export type BallLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type BallBody = MatterBody & {
  plugin: MatterBody['plugin'] & {
    ball?: {
      id: string
      level: BallLevel
      mergeLocked: boolean
      wallBounceArmed: boolean
      launchTime: number
      collisionRadius?: number
    }
  }
}

export interface GameSnapshot {
  angleDeg: number
  shotPower: number
  shotCount: number
  score: number
  bestScore: number
  comboCount: number
  mergeCount: number
  maxCombo: number
  currentLevel: BallLevel
  nextLevel: BallLevel
  floorBallCount: number
  isDangerActive: boolean
  dangerTimeLeftMs: number
  isGameOver: boolean
}

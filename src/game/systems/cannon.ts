import { Body, Vector } from 'matter-js'
import {
  AIM_GUIDE_BASE_LENGTH,
  AIM_GUIDE_MAX_LENGTH,
  CANNON_BARREL_LENGTH,
  CANNON_MAX_ANGLE_DEG,
  CANNON_MIN_ANGLE_DEG,
  CANNON_X,
  CANNON_Y,
  MAX_DRAG_DISTANCE,
  MAX_SHOT_POWER,
  MIN_DRAG_DISTANCE,
  MIN_SHOT_POWER,
  SHOOT_COOLDOWN_MS,
} from '../config'
import {
  createBallBody,
  getBallDefinition,
  getSpawnBallLevel,
} from '../entities/fruits'
import type { BallLevel } from '../types'

const SHOT_SPEED_MULTIPLIER = 1.3

export interface CannonState {
  x: number
  y: number
  angleDeg: number
  shotPower: number
  guideLength: number
  cooldownUntil: number
  isDragging: boolean
  currentLevel: BallLevel
  nextLevel: BallLevel
}

export function createCannonState(
  initialCurrentLevel: BallLevel = getSpawnBallLevel(null),
  initialNextLevel: BallLevel = getSpawnBallLevel(null),
): CannonState {
  return {
    x: CANNON_X,
    y: CANNON_Y,
    angleDeg: 0,
    shotPower: MIN_SHOT_POWER,
    guideLength: AIM_GUIDE_BASE_LENGTH,
    cooldownUntil: 0,
    isDragging: false,
    currentLevel: initialCurrentLevel,
    nextLevel: initialNextLevel,
  }
}

export function setCannonQueue(
  cannon: CannonState,
  currentLevel: BallLevel,
  nextLevel: BallLevel,
) {
  cannon.currentLevel = currentLevel
  cannon.nextLevel = nextLevel
}

export function advanceCannonQueue(cannon: CannonState, incomingNextLevel: BallLevel) {
  cannon.currentLevel = cannon.nextLevel
  cannon.nextLevel = incomingNextLevel
}

export function canShoot(cannon: CannonState, now: number) {
  return now >= cannon.cooldownUntil
}

export function startAimDrag(cannon: CannonState) {
  cannon.isDragging = true
}

export function stopAimDrag(cannon: CannonState) {
  cannon.isDragging = false
  cannon.guideLength = AIM_GUIDE_BASE_LENGTH
  cannon.shotPower = MIN_SHOT_POWER
}

export function updateAimFromPointer(
  cannon: CannonState,
  pointerX: number,
  pointerY: number,
) {
  const dragX = pointerX - cannon.x
  const dragY = pointerY - cannon.y
  const launchX = Math.max(-dragX, 0)
  const launchY = -dragY
  const angleDeg = (Math.atan2(launchY, launchX) * 180) / Math.PI
  const clampedAngleDeg = Math.min(
    CANNON_MAX_ANGLE_DEG,
    Math.max(CANNON_MIN_ANGLE_DEG, angleDeg),
  )

  const dragDistance = Vector.magnitude({ x: dragX, y: dragY })
  const clampedDistance = Math.min(Math.max(dragDistance, 0), MAX_DRAG_DISTANCE)
  const normalizedDistance = Math.min(clampedDistance / MAX_DRAG_DISTANCE, 1)
  const easedPower = Math.pow(normalizedDistance, 0.76)

  cannon.angleDeg = clampedAngleDeg
  cannon.shotPower =
    MIN_SHOT_POWER + (MAX_SHOT_POWER - MIN_SHOT_POWER) * easedPower
  cannon.guideLength =
    AIM_GUIDE_BASE_LENGTH +
    (AIM_GUIDE_MAX_LENGTH - AIM_GUIDE_BASE_LENGTH) * normalizedDistance

  return {
    dragDistance: clampedDistance,
    shouldShoot: clampedDistance >= MIN_DRAG_DISTANCE,
    normalizedPower: easedPower,
  }
}

export function shootBall(cannon: CannonState, now: number) {
  if (canShoot(cannon, now) === false) {
    return null
  }

  const angleRad = (cannon.angleDeg * Math.PI) / 180
  const radius = getBallDefinition(cannon.currentLevel).radius
  const launchX =
    cannon.x + Math.cos(angleRad) * (CANNON_BARREL_LENGTH + radius + 8)
  const launchY =
    cannon.y + Math.sin(angleRad) * (CANNON_BARREL_LENGTH + radius + 8)
  const body = createBallBody(launchX, launchY, cannon.currentLevel)

  Body.setVelocity(body, {
    x: Math.cos(angleRad) * cannon.shotPower * SHOT_SPEED_MULTIPLIER,
    y: Math.sin(angleRad) * cannon.shotPower * SHOT_SPEED_MULTIPLIER,
  })

  if (body.plugin.ball !== undefined) {
    body.plugin.ball.wallBounceArmed = true
    body.plugin.ball.launchTime = now
  }

  cannon.cooldownUntil = now + SHOOT_COOLDOWN_MS
  return body
}

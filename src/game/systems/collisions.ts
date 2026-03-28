import {
  Events,
  Sleeping,
  Vector,
  type Body as MatterBody,
  type Engine,
  type Pair,
} from 'matter-js'
import { FIXED_TIMESTEP_MS } from '../config'
import { getNextBallLevel, isBallBody } from '../entities/fruits'
import type { BallLevel, BallBody } from '../types'

const MERGE_CONTACT_MS = 0.0001
const MAX_RELATIVE_SPEED = 17.6
const IMMEDIATE_MERGE_SPEED = 16.4
const MERGE_DISTANCE_TOLERANCE = 64
const LAUNCHED_MERGE_WINDOW_MS = 2600

export interface MergeCandidate {
  bodyAId: number
  bodyBId: number
  x: number
  y: number
  sourceLevel: BallLevel
  nextLevel: BallLevel | null
  velocityX: number
  velocityY: number
  angularVelocity: number
}

interface PairState {
  contactMs: number
  hadDeepContact: boolean
  hadStrongPush: boolean
  hadDropContact: boolean
  hadLaunchHit: boolean
}

const getSpeedTowardsContact = (body: MatterBody, normalX: number, normalY: number) =>
  Math.max(0, -(body.velocity.x * normalX + body.velocity.y * normalY))

export function createCollisionHooks(engine: Engine, nowProvider: () => number = () => performance.now()) {
  const pairStates = new Map<string, PairState>()
  const mergeQueue: MergeCandidate[] = []
  const reservedBodies = new Set<number>()

  const getPairKey = (bodyA: MatterBody, bodyB: MatterBody) => {
    const low = Math.min(bodyA.id, bodyB.id)
    const high = Math.max(bodyA.id, bodyB.id)
    return String(low) + ':' + String(high)
  }

  const reserveBody = (body: BallBody) => {
    const ball = body.plugin.ball
    if (ball !== undefined) {
      ball.mergeLocked = true
      reservedBodies.add(body.id)
    }
  }

  const queueMerge = (bodyA: BallBody, bodyB: BallBody, level: BallLevel) => {
    const nextLevel = getNextBallLevel(level)
    if (nextLevel === null) {
      return
    }

    reserveBody(bodyA)
    reserveBody(bodyB)

    mergeQueue.push({
      bodyAId: bodyA.id,
      bodyBId: bodyB.id,
      x: (bodyA.position.x + bodyB.position.x) * 0.5,
      y: (bodyA.position.y + bodyB.position.y) * 0.5,
      sourceLevel: level,
      nextLevel,
      velocityX: (bodyA.velocity.x + bodyB.velocity.x) * 0.44,
      velocityY: (bodyA.velocity.y + bodyB.velocity.y) * 0.44,
      angularVelocity: (bodyA.angularVelocity + bodyB.angularVelocity) * 0.28,
    })
  }

  const tryMergePair = (
    pair: Pair,
    deltaMs: number,
    allowImmediate: boolean,
  ) => {
    const bodyA = pair.bodyA as MatterBody
    const bodyB = pair.bodyB as MatterBody

    if (isBallBody(bodyA) === false || isBallBody(bodyB) === false) {
      return
    }

    const ballA = bodyA.plugin.ball
    const ballB = bodyB.plugin.ball
    if (ballA === undefined || ballB === undefined) {
      return
    }

    if (ballA.level !== ballB.level) {
      return
    }

    if (getNextBallLevel(ballA.level) === null) {
      return
    }

    if (ballA.mergeLocked || ballB.mergeLocked) {
      return
    }

    if (reservedBodies.has(bodyA.id) || reservedBodies.has(bodyB.id)) {
      return
    }

    if (bodyA.isSleeping) {
      Sleeping.set(bodyA, false)
    }

    if (bodyB.isSleeping) {
      Sleeping.set(bodyB, false)
    }

    const key = getPairKey(bodyA, bodyB)
    const state = pairStates.get(key) ?? {
      contactMs: 0,
      hadDeepContact: false,
      hadStrongPush: false,
      hadDropContact: false,
      hadLaunchHit: false,
    }
    state.contactMs += deltaMs
    pairStates.set(key, state)

    const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity)
    const relativeSpeed = Vector.magnitude(relativeVelocity)
    const radiusA = ballA.collisionRadius ?? bodyA.circleRadius ?? 0
    const radiusB = ballB.collisionRadius ?? bodyB.circleRadius ?? 0
    const centerDistance = Vector.magnitude(Vector.sub(bodyA.position, bodyB.position))
    const penetrationDepth = pair.collision.depth
    const normalX = pair.collision.normal.x
    const normalY = pair.collision.normal.y
    const bodyAPush = getSpeedTowardsContact(bodyA, normalX, normalY)
    const bodyBPush = getSpeedTowardsContact(bodyB, -normalX, -normalY)
    const maxPushSpeed = Math.max(bodyAPush, bodyBPush)
    const isCloseEnough =
      centerDistance <= radiusA + radiusB + MERGE_DISTANCE_TOLERANCE
    const minRadius = Math.min(radiusA, radiusB)
    const hasDeepContact = penetrationDepth >= minRadius * 0.055
    const hasStrongPush = maxPushSpeed >= 0.8
    const now = nowProvider()
    const bodyAFallingOnTop = bodyA.velocity.y > 1.6 && bodyA.position.y < bodyB.position.y
    const bodyBFallingOnTop = bodyB.velocity.y > 1.6 && bodyB.position.y < bodyA.position.y
    const hasDropContact =
      penetrationDepth >= minRadius * 0.02 &&
      (bodyAFallingOnTop || bodyBFallingOnTop)
    const bodyALaunchedRecently = now - ballA.launchTime <= LAUNCHED_MERGE_WINDOW_MS
    const bodyBLaunchedRecently = now - ballB.launchTime <= LAUNCHED_MERGE_WINDOW_MS
    const launchedBodyTouchesSettledBall =
      (bodyALaunchedRecently && (bodyB.speed <= 2.5 || bodyB.isSleeping)) ||
      (bodyBLaunchedRecently && (bodyA.speed <= 2.5 || bodyA.isSleeping))
    const hasLaunchHit =
      launchedBodyTouchesSettledBall &&
      penetrationDepth >= minRadius * 0.018 &&
      relativeSpeed <= 16.8

    state.hadDeepContact = state.hadDeepContact || hasDeepContact
    state.hadStrongPush = state.hadStrongPush || hasStrongPush
    state.hadDropContact = state.hadDropContact || hasDropContact
    state.hadLaunchHit = state.hadLaunchHit || hasLaunchHit

    if (isCloseEnough === false && state.hadDeepContact === false && state.hadStrongPush === false && state.hadDropContact === false && state.hadLaunchHit === false) {
      return
    }

    const sustainedContact = state.contactMs >= MERGE_CONTACT_MS
    const immediateMerge = allowImmediate && relativeSpeed <= IMMEDIATE_MERGE_SPEED
    const restingContact = bodyA.speed <= 2.1 || bodyB.speed <= 2.1 || bodyA.isSleeping || bodyB.isSleeping
    const fallingIntoRestingMerge =
      (state.hadDeepContact || state.hadStrongPush || state.hadDropContact) &&
      relativeSpeed <= MAX_RELATIVE_SPEED &&
      restingContact
    const pushedMerge =
      state.hadStrongPush &&
      relativeSpeed <= MAX_RELATIVE_SPEED &&
      penetrationDepth >= minRadius * 0.022
    const dropMerge =
      state.hadDropContact &&
      relativeSpeed <= MAX_RELATIVE_SPEED &&
      penetrationDepth >= minRadius * 0.024
    const launchedMerge =
      state.hadLaunchHit &&
      relativeSpeed <= 16.8 &&
      penetrationDepth >= minRadius * 0.018

    if (sustainedContact === false && immediateMerge === false && fallingIntoRestingMerge === false && pushedMerge === false && dropMerge === false && launchedMerge === false) {
      return
    }

    if (relativeSpeed > MAX_RELATIVE_SPEED && state.hadLaunchHit === false) {
      return
    }

    queueMerge(bodyA, bodyB, ballA.level)
    pairStates.delete(key)
  }

  const onCollisionStart = (event: Matter.IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      tryMergePair(pair, FIXED_TIMESTEP_MS * 0.5, true)
    }
  }

  const onCollisionActive = (event: Matter.IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      tryMergePair(pair, FIXED_TIMESTEP_MS, false)
    }
  }

  const onCollisionEnd = (event: Matter.IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      pairStates.delete(getPairKey(pair.bodyA as MatterBody, pair.bodyB as MatterBody))
    }
  }

  Events.on(engine, 'collisionStart', onCollisionStart)
  Events.on(engine, 'collisionActive', onCollisionActive)
  Events.on(engine, 'collisionEnd', onCollisionEnd)

  return {
    consumeMergeQueue() {
      const items = mergeQueue.splice(0, mergeQueue.length)
      for (const item of items) {
        reservedBodies.delete(item.bodyAId)
        reservedBodies.delete(item.bodyBId)
      }
      return items
    },
    releaseBody(body: BallBody | null) {
      if (body === null) {
        return
      }

      const ball = body.plugin.ball
      if (ball !== undefined) {
        ball.mergeLocked = false
      }
      reservedBodies.delete(body.id)
    },
    destroy() {
      Events.off(engine, 'collisionStart', onCollisionStart)
      Events.off(engine, 'collisionActive', onCollisionActive)
      Events.off(engine, 'collisionEnd', onCollisionEnd)
      pairStates.clear()
      mergeQueue.length = 0
      reservedBodies.clear()
    },
  }
}

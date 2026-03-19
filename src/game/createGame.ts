import { Body, Composite, Engine, Events, type Body as MatterBody } from 'matter-js'
import {
  BACKGROUND_BOTTOM,
  BACKGROUND_TOP,
  BOWL_BOTTOM,
  CANNON_BARREL_LENGTH,
  CANNON_BASE_RADIUS,
  DANGER_DURATION_MS,
  FIXED_TIMESTEP_MS,
  MAX_PHYSICS_STEPS,
  MAX_SHOT_POWER,
  MIN_DRAG_DISTANCE,
  MIN_SHOT_POWER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config'
import {
  createBallBody,
  getBallDefinition,
  getSpawnBallLevel,
  isBallBody,
} from './entities/fruits'
import { createPhysicsEngine } from './physics/setup'
import { createCollisionHooks } from './systems/collisions'
import {
  advanceCannonQueue,
  createCannonState,
  shootBall,
  startAimDrag,
  stopAimDrag,
  updateAimFromPointer,
} from './systems/cannon'
import {
  createGameStateStore,
  createInitialGameSnapshot,
} from './state/gameState'
import type { BallBody, BallLevel, GameSnapshot } from './types'
import type { BowlGeometry } from './world/bowl'

const SHOT_SPEED_MULTIPLIER = 1.08

const BEST_SCORE_STORAGE_KEY = 'blip-perfect-best-score'
const COMBO_WINDOW_MS = 1500
const SCORE_BY_LEVEL: Partial<Record<BallLevel, number>> = {
  1: 10,
  2: 25,
  3: 60,
  4: 150,
  5: 350,
  6: 800,
  7: 1800,
}

interface CreateGameOptions {
  canvas: HTMLCanvasElement
  onStateChange: (snapshot: GameSnapshot) => void
}

interface Viewport {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
}

interface AimGuidePoint {
  x: number
  y: number
  radius: number
}

interface MergeEffect {
  x: number
  y: number
  radius: number
  startedAt: number
  durationMs: number
  specialLevel: BallLevel
}


interface FloatingScoreEffect {
  x: number
  y: number
  value: number
  startedAt: number
  durationMs: number
}

export interface GameInstance {
  resize: (width: number, height: number) => void
  pointerDown: (clientX: number, clientY: number) => void
  pointerMove: (clientX: number, clientY: number) => void
  pointerUp: (clientX: number, clientY: number) => void
  pointerCancel: (clientX: number, clientY: number) => void
  destroy: () => void
}

function readBestScore() {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    const parsed = raw === null ? 0 : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function writeBestScore(value: number) {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(value))
  } catch {
    // Ignore storage failures in sandboxed/private contexts.
  }
}

function getMergeScore(level: BallLevel) {
  return SCORE_BY_LEVEL[level] ?? 0
}

export function createGame({
  canvas,
  onStateChange,
}: CreateGameOptions): GameInstance {
  const context = canvas.getContext('2d')

  if (context === null) {
    throw new Error('2D canvas context is required')
  }

  const storedBestScore = readBestScore()
  const initialSnapshot = createInitialGameSnapshot(storedBestScore)
  const { engine, bowl } = createPhysicsEngine()
  const collisionHooks = createCollisionHooks(engine)
  const cannon = createCannonState(
    initialSnapshot.currentLevel,
    initialSnapshot.nextLevel,
  )
  const store = createGameStateStore({
    ...initialSnapshot,
    angleDeg: cannon.angleDeg,
    shotPower: cannon.shotPower,
  })
  const unsubscribe = store.subscribe(onStateChange)
  const mergeEffects: MergeEffect[] = []
  const floatingScoreEffects: FloatingScoreEffect[] = []

  let viewport: Viewport = {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }

  let animationFrameId = 0
  let previousTime = performance.now()
  let accumulator = 0

  let isDangerActive = false
  let dangerStartTime: number | null = null
  let isGameOver = false
  let floorBallCount = 0
  let score = 0
  let bestScore = storedBestScore
  let comboCount = 0
  let lastMergeAt: number | null = null

  const onWallBounce = (event: Matter.IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      const ballBody = isBallBody(pair.bodyA)
        ? pair.bodyA
        : isBallBody(pair.bodyB)
          ? pair.bodyB
          : null
      const wallBody = isBallBody(pair.bodyA)
        ? pair.bodyB
        : isBallBody(pair.bodyB)
          ? pair.bodyA
          : null

      if (ballBody === null || wallBody === null) {
        continue
      }

      const ball = ballBody.plugin.ball
      if (ball === undefined || ball.wallBounceArmed === false) {
        continue
      }

      if (wallBody.label !== 'bowl-wall-left' && wallBody.label !== 'bowl-wall-right') {
        continue
      }

      if (performance.now() - ball.launchTime > 1400) {
        ball.wallBounceArmed = false
        continue
      }

      const speedX = Math.abs(ballBody.velocity.x)
      const bounceX = Math.max(speedX * 0.18, 1.7)
      const nextX = wallBody.label === 'bowl-wall-left' ? bounceX : -bounceX
      const nextY = Math.min(ballBody.velocity.y, -0.36)

      Body.setVelocity(ballBody, { x: nextX, y: nextY })
      ball.wallBounceArmed = false
    }
  }

  Events.on(engine, 'collisionStart', onWallBounce)

  const syncSnapshot = (now = performance.now()) => {
    if (lastMergeAt !== null && now - lastMergeAt > COMBO_WINDOW_MS && comboCount !== 0) {
      comboCount = 0
    }

    const dangerTimeLeftMs =
      isDangerActive && dangerStartTime !== null
        ? Math.max(DANGER_DURATION_MS - (now - dangerStartTime), 0)
        : DANGER_DURATION_MS

    store.update({
      angleDeg: cannon.angleDeg,
      shotPower: cannon.shotPower,
      score,
      bestScore,
      comboCount,
      currentLevel: cannon.currentLevel,
      nextLevel: cannon.nextLevel,
      floorBallCount,
      isDangerActive,
      dangerTimeLeftMs,
      isGameOver,
    })
  }

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const localX = clientX - rect.left
    const localY = clientY - rect.top

    return {
      x: (localX - viewport.offsetX) / viewport.scale,
      y: (localY - viewport.offsetY) / viewport.scale,
    }
  }

  const canGrabAnchor = (worldX: number, worldY: number) => {
    const dx = worldX - cannon.x
    const dy = worldY - cannon.y
    return dx * dx + dy * dy <= 132 * 132
  }

  const getDangerLineY = (x: number) => {
    const startX = bowl.geometry.dangerStartX
    const endX = bowl.geometry.dangerEndX

    if (x < startX || x > endX) {
      return null
    }

    const t = (x - startX) / (endX - startX)
    return bowl.geometry.dangerStartY + (bowl.geometry.dangerEndY - bowl.geometry.dangerStartY) * t
  }

  const getMaxFieldLevel = (): BallLevel | null => {
    const bodies = Composite.allBodies(engine.world)
    let maxLevel: BallLevel | null = null

    for (const body of bodies) {
      if (isBallBody(body) === false) {
        continue
      }

      const ball = body.plugin.ball
      if (ball === undefined) {
        continue
      }

      if (maxLevel === null || ball.level > maxLevel) {
        maxLevel = ball.level
      }
    }

    return maxLevel
  }

  const buildAimGuide = (): AimGuidePoint[] => {
    const points: AimGuidePoint[] = []
    const angleRad = (cannon.angleDeg * Math.PI) / 180
    const muzzleRadius = getBallDefinition(cannon.currentLevel).radius
    let px =
      cannon.x + Math.cos(angleRad) * (CANNON_BARREL_LENGTH + muzzleRadius + 8)
    let py =
      cannon.y + Math.sin(angleRad) * (CANNON_BARREL_LENGTH + muzzleRadius + 8)
    let vx = Math.cos(angleRad) * cannon.shotPower * SHOT_SPEED_MULTIPLIER
    let vy = Math.sin(angleRad) * cannon.shotPower * SHOT_SPEED_MULTIPLIER
    const gravityStep =
      engine.gravity.y * engine.gravity.scale * FIXED_TIMESTEP_MS * FIXED_TIMESTEP_MS
    const powerRatio = Math.min(
      Math.max((cannon.shotPower - MIN_SHOT_POWER) / (MAX_SHOT_POWER - MIN_SHOT_POWER), 0),
      1,
    )
    const radius = 1.8 + powerRatio * 2.2

    for (let step = 0; step < 18; step += 1) {
      px += vx
      py += vy
      vy += gravityStep

      if (px > WORLD_WIDTH || py > WORLD_HEIGHT || py < 0) {
        break
      }

      points.push({ x: px, y: py, radius })
    }

    return points
  }

  const applyMerges = (time: number) => {
    for (const candidate of collisionHooks.consumeMergeQueue()) {
      const bodyA = Composite.get(engine.world, candidate.bodyAId, 'body') as BallBody | null
      const bodyB = Composite.get(engine.world, candidate.bodyBId, 'body') as BallBody | null

      if (bodyA === null || bodyB === null) {
        collisionHooks.releaseBody(bodyA)
        collisionHooks.releaseBody(bodyB)
        continue
      }

      if (isBallBody(bodyA) === false || isBallBody(bodyB) === false) {
        collisionHooks.releaseBody(bodyA)
        collisionHooks.releaseBody(bodyB)
        continue
      }

      const ballA = bodyA.plugin.ball
      const ballB = bodyB.plugin.ball
      if (ballA === undefined || ballB === undefined) {
        collisionHooks.releaseBody(bodyA)
        collisionHooks.releaseBody(bodyB)
        continue
      }

      if (ballA.level !== ballB.level || candidate.nextLevel === null) {
        collisionHooks.releaseBody(bodyA)
        collisionHooks.releaseBody(bodyB)
        continue
      }

      Composite.remove(engine.world, bodyA)
      Composite.remove(engine.world, bodyB)

      const mergedBall = createBallBody(candidate.x, candidate.y, candidate.nextLevel)
      Body.setVelocity(mergedBall, {
        x: candidate.velocityX,
        y: candidate.velocityY,
      })
      Body.setAngularVelocity(mergedBall, candidate.angularVelocity)
      Composite.add(engine.world, mergedBall)

      const baseScore = getMergeScore(candidate.nextLevel)
      if (lastMergeAt !== null && time - lastMergeAt <= COMBO_WINDOW_MS) {
        comboCount += 1
      } else {
        comboCount = 1
      }
      lastMergeAt = time

      const comboBonus = comboCount > 1
        ? Math.round(baseScore * 0.15 * (comboCount - 1))
        : 0
      score += baseScore + comboBonus

      if (score > bestScore) {
        bestScore = score
        writeBestScore(bestScore)
      }

      mergeEffects.push({
        x: candidate.x,
        y: candidate.y,
        radius: getBallDefinition(candidate.nextLevel).radius * (candidate.nextLevel >= 7 ? 1.95 : candidate.nextLevel === 6 ? 1.65 : 1.35),
        startedAt: time,
        durationMs: candidate.nextLevel >= 7 ? 420 : candidate.nextLevel === 6 ? 320 : 180,
        specialLevel: candidate.nextLevel,
      })

      floatingScoreEffects.push({
        x: candidate.x,
        y: candidate.y - getBallDefinition(candidate.nextLevel).radius * 0.35,
        value: baseScore + comboBonus,
        startedAt: time,
        durationMs: 1000,
      })
    }
  }

  const updateFloorBallState = () => {
    const bodies = Composite.allBodies(engine.world)
    let nextFloorBallCount = 0

    for (const body of bodies) {
      if (isBallBody(body) === false) {
        continue
      }

      const radius = body.circleRadius ?? 0
      const isOnFloorBand = body.position.y + radius >= BOWL_BOTTOM - 6
      const isInsideBowl =
        body.position.x >= bowl.geometry.leftX &&
        body.position.x <= bowl.geometry.rightX

      if (isOnFloorBand && isInsideBowl === false) {
        nextFloorBallCount += 1
      }
    }

    floorBallCount = nextFloorBallCount
    if (floorBallCount >= 3) {
      isGameOver = true
    }
  }

  const updateDangerState = (time: number) => {
    const bodies = Composite.allBodies(engine.world)
    let nextDanger = false

    for (const body of bodies) {
      if (isBallBody(body) === false) {
        continue
      }

      const radius = body.circleRadius ?? 0
      const lineY = getDangerLineY(body.position.x)
      if (lineY === null) {
        continue
      }

      if (body.position.y - radius < lineY) {
        nextDanger = true
        break
      }
    }

    if (nextDanger) {
      if (dangerStartTime === null) {
        dangerStartTime = time
      }
      isDangerActive = true

      if (time - dangerStartTime >= DANGER_DURATION_MS) {
        isGameOver = true
      }
    } else {
      isDangerActive = false
      dangerStartTime = null
    }
  }

  const render = (now: number) => {
    const dpr = window.devicePixelRatio || 1
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    const gradient = context.createLinearGradient(0, 0, 0, viewport.height)
    gradient.addColorStop(0, BACKGROUND_TOP)
    gradient.addColorStop(1, BACKGROUND_BOTTOM)

    context.fillStyle = gradient
    context.fillRect(0, 0, viewport.width, viewport.height)
    drawBackdrop(context)

    context.save()
    context.translate(viewport.offsetX, viewport.offsetY)
    context.scale(viewport.scale, viewport.scale)

    drawGround(context)
    drawBowl(context, bowl.geometry)
    drawDangerLine(context, bowl.geometry, isDangerActive, dangerStartTime, isGameOver, now)
    drawCannon(context, cannon.x, cannon.y, cannon.angleDeg, cannon.currentLevel)
    drawAimGuide(context, buildAimGuide())

    const bodies = Composite.allBodies(engine.world)
    for (const body of bodies) {
      if (isBallBody(body)) {
        drawBall(context, body)
      }
    }

    drawMergeEffects(context, mergeEffects, now)
    drawFloatingScores(context, floatingScoreEffects, now)

    context.restore()
  }

  const frame = (time: number) => {
    const delta = Math.min(time - previousTime, 100)
    previousTime = time
    accumulator += delta

    let steps = 0
    while (accumulator >= FIXED_TIMESTEP_MS && steps < MAX_PHYSICS_STEPS) {
      if (isGameOver === false) {
        Engine.update(engine, FIXED_TIMESTEP_MS)
        applyMerges(time)
        updateFloorBallState()
        updateDangerState(time)
      }
      accumulator -= FIXED_TIMESTEP_MS
      steps += 1
    }

    for (let index = mergeEffects.length - 1; index >= 0; index -= 1) {
      const effect = mergeEffects[index]
      if (time - effect.startedAt > effect.durationMs) {
        mergeEffects.splice(index, 1)
      }
    }

    for (let index = floatingScoreEffects.length - 1; index >= 0; index -= 1) {
      const effect = floatingScoreEffects[index]
      if (time - effect.startedAt > effect.durationMs) {
        floatingScoreEffects.splice(index, 1)
      }
    }

    syncSnapshot(time)
    render(time)
    animationFrameId = window.requestAnimationFrame(frame)
  }

  syncSnapshot(performance.now())
  render(performance.now())
  animationFrameId = window.requestAnimationFrame(frame)

  return {
    resize(width, height) {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = String(width) + 'px'
      canvas.style.height = String(height) + 'px'

      const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT)
      viewport = {
        width,
        height,
        scale,
        offsetX: (width - WORLD_WIDTH * scale) / 2,
        offsetY: (height - WORLD_HEIGHT * scale) / 2,
      }

      syncSnapshot(performance.now())
      render(performance.now())
    },
    pointerDown(clientX, clientY) {
      const point = screenToWorld(clientX, clientY)
      if (canGrabAnchor(point.x, point.y) === false) {
        return
      }

      if (isGameOver) {
        return
      }

      startAimDrag(cannon)
      updateAimFromPointer(cannon, point.x, point.y)
      syncSnapshot()
      render(performance.now())
    },
    pointerMove(clientX, clientY) {
      if (cannon.isDragging === false || isGameOver) {
        return
      }

      const point = screenToWorld(clientX, clientY)
      updateAimFromPointer(cannon, point.x, point.y)
      syncSnapshot()
      render(performance.now())
    },
    pointerUp(clientX, clientY) {
      if (cannon.isDragging === false || isGameOver) {
        return
      }

      const point = screenToWorld(clientX, clientY)
      const aimResult = updateAimFromPointer(cannon, point.x, point.y)

      if (aimResult.dragDistance >= MIN_DRAG_DISTANCE) {
        const body = shootBall(cannon, performance.now())
        if (body !== null) {
          Composite.add(engine.world, body)
          advanceCannonQueue(cannon, getSpawnBallLevel(getMaxFieldLevel()))
          const snapshot = store.getSnapshot()
          store.update({ shotCount: snapshot.shotCount + 1 })
        }
      }

      stopAimDrag(cannon)
      syncSnapshot()
      render(performance.now())
    },
    pointerCancel(clientX, clientY) {
      if (cannon.isDragging === false || isGameOver) {
        return
      }

      const point = screenToWorld(clientX, clientY)
      updateAimFromPointer(cannon, point.x, point.y)
      stopAimDrag(cannon)
      syncSnapshot()
      render(performance.now())
    },
    destroy() {
      window.cancelAnimationFrame(animationFrameId)
      Events.off(engine, 'collisionStart', onWallBounce)
      collisionHooks.destroy()
      unsubscribe()
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    },
  }
}


function drawBackdrop(context: CanvasRenderingContext2D) {
  context.save()

  context.fillStyle = 'rgba(150, 179, 126, 0.14)'
  for (let index = 0; index < 7; index += 1) {
    const x = 110 + index * 176
    context.beginPath()
    context.ellipse(x, WORLD_HEIGHT - 46, 84, 22, 0, Math.PI, Math.PI * 2)
    context.fill()
  }

  context.strokeStyle = 'rgba(188, 168, 136, 0.16)'
  context.lineWidth = 2
  for (let index = 0; index < 5; index += 1) {
    const x = 160 + index * 220
    context.beginPath()
    context.moveTo(x, 30)
    context.lineTo(x, WORLD_HEIGHT - 180)
    context.stroke()
  }

  context.strokeStyle = 'rgba(120, 159, 92, 0.12)'
  context.lineWidth = 10
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(92, 144)
  context.quadraticCurveTo(172, 96, 230, 174)
  context.stroke()
  context.beginPath()
  context.moveTo(1070, 126)
  context.quadraticCurveTo(996, 82, 930, 168)
  context.stroke()

  context.restore()
}

function drawGround(context: CanvasRenderingContext2D) {
  const woodGradient = context.createLinearGradient(0, BOWL_BOTTOM, 0, WORLD_HEIGHT)
  woodGradient.addColorStop(0, '#a97244')
  woodGradient.addColorStop(0.35, '#9a683c')
  woodGradient.addColorStop(1, '#7d522f')

  context.fillStyle = woodGradient
  context.fillRect(0, BOWL_BOTTOM, WORLD_WIDTH, WORLD_HEIGHT - BOWL_BOTTOM)

  context.strokeStyle = 'rgba(255, 239, 216, 0.16)'
  context.lineWidth = 4
  for (let y = BOWL_BOTTOM + 18; y < WORLD_HEIGHT; y += 26) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(WORLD_WIDTH, y)
    context.stroke()
  }
}

function drawBowl(context: CanvasRenderingContext2D, bowl: BowlGeometry) {
  context.save()

  const fillGradient = context.createLinearGradient(bowl.leftX, bowl.leftRimY, bowl.rightX, bowl.bottom)
  fillGradient.addColorStop(0, 'rgba(255, 251, 243, 0.96)')
  fillGradient.addColorStop(1, 'rgba(244, 232, 213, 0.98)')

  context.fillStyle = fillGradient
  context.beginPath()
  context.moveTo(bowl.leftX, bowl.leftRimY)
  context.lineTo(bowl.leftX, bowl.bottom)
  context.lineTo(bowl.rightX, bowl.bottom)
  context.lineTo(bowl.rightX, bowl.rightRimY)
  context.closePath()
  context.fill()

  context.strokeStyle = '#d8b794'
  context.lineWidth = 22
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(bowl.leftX, bowl.leftRimY)
  context.lineTo(bowl.leftX, bowl.bottom)
  context.lineTo(bowl.rightX, bowl.bottom)
  context.lineTo(bowl.rightX, bowl.rightRimY)
  context.stroke()

  context.strokeStyle = 'rgba(120, 82, 46, 0.22)'
  context.lineWidth = 7
  context.beginPath()
  context.moveTo(bowl.leftX + 10, bowl.leftRimY + 10)
  context.lineTo(bowl.leftX + 10, bowl.bottom - 8)
  context.lineTo(bowl.rightX - 10, bowl.bottom - 8)
  context.lineTo(bowl.rightX - 10, bowl.rightRimY + 10)
  context.stroke()

  context.fillStyle = 'rgba(206, 235, 194, 0.18)'
  context.fillRect(bowl.leftX + 12, bowl.bottom - 56, bowl.rightX - bowl.leftX - 24, 34)
  context.restore()
}

function drawCannon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  level: BallLevel,
) {
  const angleRad = (angleDeg * Math.PI) / 180
  const definition = getBallDefinition(level)
  const previewX = x + Math.cos(angleRad) * (CANNON_BARREL_LENGTH + definition.radius + 8)
  const previewY = y + Math.sin(angleRad) * (CANNON_BARREL_LENGTH + definition.radius + 8)

  context.save()
  context.translate(x, y)
  context.rotate(angleRad)

  const barrelGradient = context.createLinearGradient(0, -22, CANNON_BARREL_LENGTH + 24, 22)
  barrelGradient.addColorStop(0, '#dce7d5')
  barrelGradient.addColorStop(1, '#8ea78a')
  context.fillStyle = barrelGradient
  context.strokeStyle = '#7a5332'
  context.lineWidth = 4

  context.beginPath()
  context.roundRect(-10, -18, CANNON_BARREL_LENGTH + 28, 36, 18)
  context.fill()
  context.stroke()

  context.fillStyle = '#c78b57'
  context.beginPath()
  context.arc(CANNON_BARREL_LENGTH + 16, 0, 16, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.fillStyle = 'rgba(255, 255, 255, 0.28)'
  context.beginPath()
  context.roundRect(-2, -11, CANNON_BARREL_LENGTH + 10, 7, 4)
  context.fill()
  context.restore()

  context.fillStyle = '#c8aa84'
  context.strokeStyle = '#7a5332'
  context.lineWidth = 4
  context.beginPath()
  context.arc(x, y, CANNON_BASE_RADIUS + 6, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.fillStyle = '#f6ead5'
  context.beginPath()
  context.arc(x, y, CANNON_BASE_RADIUS - 4, 0, Math.PI * 2)
  context.fill()

  drawBallSprite(context, previewX, previewY, 0, definition, true)
}

function drawAimGuide(
  context: CanvasRenderingContext2D,
  points: AimGuidePoint[],
) {
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const alpha = 1 - index / Math.max(points.length, 1)

    context.globalAlpha = 0.24 + alpha * 0.46
    context.fillStyle = '#9ebd70'
    context.beginPath()
    context.arc(point.x, point.y, point.radius + 1.2, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#fff7eb'
    context.beginPath()
    context.arc(point.x, point.y, point.radius * 0.55, 0, Math.PI * 2)
    context.fill()
  }

  context.globalAlpha = 1
}

function drawDangerLine(
  context: CanvasRenderingContext2D,
  bowl: BowlGeometry,
  isDangerActive: boolean,
  dangerStartTime: number | null,
  isGameOver: boolean,
  now: number,
) {
  const dashColor = isGameOver ? '#d85c4b' : isDangerActive ? '#e08a4a' : '#ddab5e'
  const remainingMs =
    isDangerActive && dangerStartTime !== null
      ? Math.max(DANGER_DURATION_MS - (now - dangerStartTime), 0)
      : DANGER_DURATION_MS

  context.save()
  context.strokeStyle = dashColor
  context.fillStyle = dashColor
  context.lineWidth = 2.5
  context.setLineDash([10, 9])
  context.beginPath()
  context.moveTo(bowl.dangerStartX, bowl.dangerStartY)
  context.lineTo(bowl.dangerEndX, bowl.dangerEndY)
  context.stroke()
  context.setLineDash([])

  context.font = '700 16px sans-serif'
  context.fillText('DANGER', bowl.dangerStartX + 8, bowl.dangerStartY - 12)

  if (isDangerActive) {
    const seconds = (remainingMs / 1000).toFixed(1) + 's'
    context.font = '600 13px sans-serif'
    context.fillText(seconds, bowl.dangerEndX - 44, bowl.dangerEndY - 12)
  }

  context.restore()
}

function drawMergeEffects(
  context: CanvasRenderingContext2D,
  effects: MergeEffect[],
  now: number,
) {
  for (const effect of effects) {
    const progress = (now - effect.startedAt) / effect.durationMs
    const clamped = Math.min(Math.max(progress, 0), 1)
    const alpha = 1 - clamped
    const radius = effect.radius * (0.72 + clamped * 0.36)

    context.strokeStyle = effect.specialLevel >= 7
      ? 'rgba(255, 248, 220, ' + String(alpha * 0.86) + ')'
      : effect.specialLevel === 6
        ? 'rgba(244, 215, 255, ' + String(alpha * 0.78) + ')'
        : 'rgba(247, 198, 98, ' + String(alpha * 0.7) + ')'
    context.lineWidth = effect.specialLevel >= 7 ? 5.4 - clamped * 2 : effect.specialLevel === 6 ? 4.6 - clamped * 1.8 : 3.2 - clamped * 1.5
    context.beginPath()
    context.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
    context.stroke()

    const sparkCount = effect.specialLevel >= 7 ? 18 : effect.specialLevel === 6 ? 12 : 6
    for (let index = 0; index < sparkCount; index += 1) {
      const angle = (Math.PI * 2 * index) / sparkCount + clamped * 0.4
      const spread = effect.specialLevel >= 7 ? 0.56 + clamped * 0.62 : 0.7
      const sparkX = effect.x + Math.cos(angle) * radius * spread
      const sparkY = effect.y + Math.sin(angle) * radius * spread
      context.fillStyle = effect.specialLevel >= 7
        ? 'rgba(255, 248, 220, ' + String(alpha * 0.96) + ')'
        : effect.specialLevel === 6
          ? 'rgba(255, 248, 238, ' + String(alpha * 0.92) + ')'
          : 'rgba(255, 245, 212, ' + String(alpha * 0.85) + ')'
      context.beginPath()
      context.arc(sparkX, sparkY, (effect.specialLevel >= 7 ? 3.8 : effect.specialLevel === 6 ? 3.2 : 2.4) + alpha * (effect.specialLevel >= 7 ? 2.2 : effect.specialLevel === 6 ? 1.8 : 1.4), 0, Math.PI * 2)
      context.fill()
    }

    if (effect.specialLevel >= 7) {
      const pollenCount = 22
      for (let index = 0; index < pollenCount; index += 1) {
        const angle = (Math.PI * 2 * index) / pollenCount + clamped * 1.35
        const ring = radius * (0.32 + clamped * 1.05)
        const drift = 1 + (index % 3) * 0.08
        const pollenX = effect.x + Math.cos(angle) * ring * drift
        const pollenY = effect.y + Math.sin(angle) * ring * (0.82 + (index % 4) * 0.06)

        context.fillStyle = index % 2 === 0
          ? 'rgba(255, 248, 220, ' + String(alpha * 0.72) + ')'
          : 'rgba(169, 211, 158, ' + String(alpha * 0.44) + ')'
        context.beginPath()
        context.arc(pollenX, pollenY, 1.4 + alpha * 1.8, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
}

function drawFloatingScores(
  context: CanvasRenderingContext2D,
  effects: FloatingScoreEffect[],
  now: number,
) {
  for (const effect of effects) {
    const progress = Math.min(Math.max((now - effect.startedAt) / effect.durationMs, 0), 1)
    const alpha = 1 - progress
    const offsetY = progress * 34

    context.save()
    context.globalAlpha = alpha
    context.fillStyle = '#fff2c4'
    context.strokeStyle = 'rgba(122, 83, 50, ' + String(alpha * 0.85) + ')'
    context.lineWidth = 4
    context.font = '700 24px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.strokeText('+' + String(effect.value), effect.x, effect.y - offsetY)
    context.fillText('+' + String(effect.value), effect.x, effect.y - offsetY)
    context.restore()
  }
}

function drawBall(context: CanvasRenderingContext2D, body: MatterBody) {
  if (isBallBody(body) === false) {
    return
  }

  const ball = body.plugin.ball
  if (ball === undefined) {
    return
  }

  const definition = getBallDefinition(ball.level)
  drawBallSprite(context, body.position.x, body.position.y, body.angle, definition, false)
}

function drawBallSprite(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  definition: ReturnType<typeof getBallDefinition>,
  isPreview: boolean,
) {
  const radius = definition.radius

  context.save()
  context.translate(x, y)
  context.rotate(angle)

  context.fillStyle = 'rgba(111, 76, 43, 0.14)'
  context.beginPath()
  context.arc(radius * 0.16, radius * 0.18, radius * 0.95, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.clip()

  const bodyGradient = context.createRadialGradient(
    -radius * 0.35,
    -radius * 0.4,
    radius * 0.18,
    0,
    0,
    radius * 1.1,
  )
  bodyGradient.addColorStop(0, '#fff8ef')
  bodyGradient.addColorStop(0.24, definition.accent)
  bodyGradient.addColorStop(0.55, definition.fill)
  bodyGradient.addColorStop(1, definition.stroke)
  context.fillStyle = bodyGradient
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.fill()

  drawBallDetails(context, definition)

  context.restore()

  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.strokeStyle = definition.stroke
  context.lineWidth = isPreview ? 3.5 : 3
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.stroke()

  context.fillStyle = 'rgba(255, 255, 255, 0.42)'
  context.beginPath()
  context.ellipse(-radius * 0.34, -radius * 0.42, radius * 0.26, radius * 0.16, -0.5, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawBallDetails(
  context: CanvasRenderingContext2D,
  definition: ReturnType<typeof getBallDefinition>,
) {
  const radius = definition.radius

  switch (definition.level) {
    case 0:
      context.strokeStyle = 'rgba(122, 83, 50, 0.45)'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(0, -radius * 0.34)
      context.quadraticCurveTo(radius * 0.08, 0, 0, radius * 0.38)
      context.stroke()
      break
    case 1:
      drawLeaf(context, -radius * 0.18, -radius * 0.7, radius * 0.34, radius * 0.18, -0.85, definition.leaf)
      drawLeaf(context, radius * 0.18, -radius * 0.7, radius * 0.34, radius * 0.18, 0.85, definition.leaf)
      break
    case 2:
      drawLeaf(context, -radius * 0.2, -radius * 0.68, radius * 0.32, radius * 0.17, -0.8, definition.leaf)
      drawLeaf(context, radius * 0.2, -radius * 0.68, radius * 0.32, radius * 0.17, 0.8, definition.leaf)
      context.fillStyle = definition.accent
      context.beginPath()
      context.moveTo(0, -radius * 0.78)
      context.quadraticCurveTo(radius * 0.24, -radius * 0.52, 0, -radius * 0.24)
      context.quadraticCurveTo(-radius * 0.24, -radius * 0.52, 0, -radius * 0.78)
      context.fill()
      break
    case 3:
      drawPetalRing(context, radius, definition.accent, '#f9e4aa', 7, 0.56)
      break
    case 4:
      drawPetalRing(context, radius, definition.accent, '#f1c55f', 8, 0.62)
      drawPetalRing(context, radius * 0.8, '#f8c4b2', '#ffd55c', 7, 0.42)
      break
    case 5:
      drawLeaf(context, -radius * 0.34, radius * 0.08, radius * 0.16, radius * 0.1, -0.55, definition.leaf)
      drawLeaf(context, radius * 0.34, radius * 0.08, radius * 0.16, radius * 0.1, 0.55, definition.leaf)
      drawPetalRing(context, radius, '#f49aaf', '#f1c94a', 8, 0.62)
      drawPetalRing(context, radius * 0.78, '#ffd7e6', '#f1c94a', 7, 0.4)
      break
    case 6:
      drawMoonAura(context, radius)
      drawLeaf(context, -radius * 0.44, -radius * 0.08, radius * 0.18, radius * 0.08, -0.65, definition.leaf)
      drawLeaf(context, radius * 0.44, -radius * 0.08, radius * 0.18, radius * 0.08, 0.65, definition.leaf)
      drawLongPetalRing(context, radius, '#cab8ff', 12, 0.74, 0.28, 0.12)
      drawLongPetalRing(context, radius * 0.82, '#f8e7f2', 10, 0.52, 0.22, 0.11)
      drawMoonCore(context, radius)
      drawTinyFace(context, radius, 'rgba(122, 83, 50, 0.75)')
      break
    case 7:
      drawStarlitAura(context, radius)
      drawLeaf(context, -radius * 0.42, 0, radius * 0.16, radius * 0.07, -0.55, definition.leaf)
      drawLeaf(context, radius * 0.42, 0, radius * 0.16, radius * 0.07, 0.55, definition.leaf)
      drawSoftHaloPetals(context, radius, '#cdbeff', 12, 0.66, 0.3, 0.17)
      drawSoftHaloPetals(context, radius * 0.8, '#f7e7f7', 10, 0.44, 0.24, 0.14)
      drawStarRing(context, radius)
      drawStarlitCore(context, radius)
      drawTinyCrown(context, radius)
      drawTinyFace(context, radius * 0.84, 'rgba(122, 83, 50, 0.55)')
      break
  }

  if (definition.level < 6) {
    drawFace(context, radius, definition.stroke)
  }
}

function drawLeaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  color: string,
) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.fillStyle = color
  context.beginPath()
  context.ellipse(0, 0, width, height, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = 'rgba(122, 83, 50, 0.18)'
  context.lineWidth = 1.2
  context.beginPath()
  context.moveTo(-width * 0.7, 0)
  context.lineTo(width * 0.7, 0)
  context.stroke()
  context.restore()
}

function drawPetalRing(
  context: CanvasRenderingContext2D,
  radius: number,
  petalColor: string,
  centerColor: string,
  petalCount: number,
  offset: number,
) {
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount - Math.PI / 2
    const px = Math.cos(angle) * radius * offset
    const py = Math.sin(angle) * radius * offset

    context.fillStyle = petalColor
    context.beginPath()
    context.ellipse(px, py, radius * 0.24, radius * 0.17, angle, 0, Math.PI * 2)
    context.fill()
  }

  context.fillStyle = centerColor
  context.beginPath()
  context.arc(0, 0, radius * 0.26, 0, Math.PI * 2)
  context.fill()
}

function drawStarlitAura(context: CanvasRenderingContext2D, radius: number) {
  const aura = context.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 1.14)
  aura.addColorStop(0, 'rgba(255, 243, 176, 0.38)')
  aura.addColorStop(0.35, 'rgba(247, 231, 247, 0.28)')
  aura.addColorStop(0.7, 'rgba(205, 190, 255, 0.22)')
  aura.addColorStop(1, 'rgba(205, 190, 255, 0)')
  context.fillStyle = aura
  context.beginPath()
  context.arc(0, 0, radius * 1.08, 0, Math.PI * 2)
  context.fill()
}

function drawSoftHaloPetals(
  context: CanvasRenderingContext2D,
  radius: number,
  color: string,
  petalCount: number,
  offset: number,
  petalWidth: number,
  petalHeight: number,
) {
  context.save()
  context.globalAlpha = 0.72
  drawLongPetalRing(context, radius, color, petalCount, offset, petalWidth, petalHeight)
  context.restore()
}

function drawStarRing(context: CanvasRenderingContext2D, radius: number) {
  context.save()
  context.strokeStyle = 'rgba(255, 248, 220, 0.72)'
  context.lineWidth = 2
  context.beginPath()
  context.arc(0, 0, radius * 0.9, 0, Math.PI * 2)
  context.stroke()

  for (let index = 0; index < 10; index += 1) {
    const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2
    const px = Math.cos(angle) * radius * 0.9
    const py = Math.sin(angle) * radius * 0.9
    context.fillStyle = 'rgba(255, 248, 220, 0.92)'
    context.beginPath()
    context.arc(px, py, radius * 0.035, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawStarlitCore(context: CanvasRenderingContext2D, radius: number) {
  const outer = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 0.4)
  outer.addColorStop(0, '#fffdf0')
  outer.addColorStop(0.34, '#fff3b0')
  outer.addColorStop(0.7, '#ffe08a')
  outer.addColorStop(1, 'rgba(255, 224, 138, 0.28)')
  context.fillStyle = outer
  context.beginPath()
  context.arc(0, 0, radius * 0.29, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255, 248, 220, 0.9)'
  context.beginPath()
  context.arc(-radius * 0.08, -radius * 0.1, radius * 0.08, 0, Math.PI * 2)
  context.fill()
}

function drawTinyCrown(context: CanvasRenderingContext2D, radius: number) {
  context.save()
  context.translate(0, -radius * 0.58)

  const crownGradient = context.createLinearGradient(0, -radius * 0.12, 0, radius * 0.18)
  crownGradient.addColorStop(0, '#fff8cf')
  crownGradient.addColorStop(0.55, '#f2d46d')
  crownGradient.addColorStop(1, '#c99633')

  context.fillStyle = crownGradient
  context.strokeStyle = 'rgba(122, 83, 50, 0.4)'
  context.lineWidth = Math.max(radius * 0.024, 1.4)
  context.lineJoin = 'round'

  context.beginPath()
  context.moveTo(-radius * 0.22, radius * 0.12)
  context.lineTo(-radius * 0.14, -radius * 0.02)
  context.lineTo(-radius * 0.04, radius * 0.02)
  context.lineTo(0, -radius * 0.14)
  context.lineTo(radius * 0.04, radius * 0.02)
  context.lineTo(radius * 0.14, -radius * 0.02)
  context.lineTo(radius * 0.22, radius * 0.12)
  context.closePath()
  context.fill()
  context.stroke()

  context.fillStyle = 'rgba(255, 248, 220, 0.92)'
  for (const [px, py, size] of [
    [-0.14, -0.02, 0.038],
    [0, -0.14, 0.046],
    [0.14, -0.02, 0.038],
  ]) {
    context.beginPath()
    context.arc(radius * px, radius * py, radius * size, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawMoonAura(context: CanvasRenderingContext2D, radius: number) {
  const aura = context.createRadialGradient(0, 0, radius * 0.18, 0, 0, radius * 1.05)
  aura.addColorStop(0, 'rgba(255, 247, 205, 0.42)')
  aura.addColorStop(0.55, 'rgba(238, 228, 255, 0.22)')
  aura.addColorStop(1, 'rgba(202, 184, 255, 0)')
  context.fillStyle = aura
  context.beginPath()
  context.arc(0, 0, radius * 1.02, 0, Math.PI * 2)
  context.fill()
}

function drawLongPetalRing(
  context: CanvasRenderingContext2D,
  radius: number,
  petalColor: string,
  petalCount: number,
  offset: number,
  petalWidth: number,
  petalHeight: number,
) {
  for (let index = 0; index < petalCount; index += 1) {
    const angle = (Math.PI * 2 * index) / petalCount - Math.PI / 2
    const px = Math.cos(angle) * radius * offset
    const py = Math.sin(angle) * radius * offset

    context.fillStyle = petalColor
    context.beginPath()
    context.ellipse(px, py, radius * petalWidth, radius * petalHeight, angle, 0, Math.PI * 2)
    context.fill()
  }
}

function drawMoonCore(context: CanvasRenderingContext2D, radius: number) {
  const core = context.createRadialGradient(-radius * 0.08, -radius * 0.1, radius * 0.04, 0, 0, radius * 0.34)
  core.addColorStop(0, '#fffdf0')
  core.addColorStop(0.42, '#fff0a8')
  core.addColorStop(1, '#f3d781')
  context.fillStyle = core
  context.beginPath()
  context.arc(0, 0, radius * 0.26, 0, Math.PI * 2)
  context.fill()
}

function drawTinyFace(context: CanvasRenderingContext2D, radius: number, color: string) {
  const faceY = radius * 0.18
  context.fillStyle = color
  context.beginPath()
  context.arc(-radius * 0.11, faceY, Math.max(radius * 0.032, 1.6), 0, Math.PI * 2)
  context.arc(radius * 0.11, faceY, Math.max(radius * 0.032, 1.6), 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = color
  context.lineWidth = Math.max(radius * 0.024, 1.3)
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(-radius * 0.09, faceY + radius * 0.09)
  context.quadraticCurveTo(0, faceY + radius * 0.16, radius * 0.09, faceY + radius * 0.09)
  context.stroke()
}

function drawFace(context: CanvasRenderingContext2D, radius: number, color: string) {
  const faceY = radius * 0.18
  context.fillStyle = color
  context.beginPath()
  context.arc(-radius * 0.18, faceY, Math.max(radius * 0.06, 2), 0, Math.PI * 2)
  context.arc(radius * 0.18, faceY, Math.max(radius * 0.06, 2), 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = color
  context.lineWidth = Math.max(radius * 0.04, 1.6)
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(-radius * 0.16, faceY + radius * 0.15)
  context.quadraticCurveTo(0, faceY + radius * 0.28, radius * 0.16, faceY + radius * 0.15)
  context.stroke()
}

import { Bodies, type Body as MatterBody } from "matter-js"
import {
  BALL_DENSITY,
  BALL_FRICTION_AIR,
  BALL_RESTITUTION,
  BALL_SLEEP_THRESHOLD,
} from "../config"
import type { BallBody, BallLevel } from "../types"

export interface BallDefinition {
  level: BallLevel
  radius: number
  fill: string
  stroke: string
  accent: string
  leaf: string
  name: string
}

const BALL_DEFINITIONS: BallDefinition[] = [
  {
    level: 0,
    radius: 18.9,
    fill: "#9f7a55",
    stroke: "#7a5332",
    accent: "#c7a07b",
    leaf: "#b8d98b",
    name: "Seed",
  },
  {
    level: 1,
    radius: 26.25,
    fill: "#b09b67",
    stroke: "#7a5332",
    accent: "#ddd0a2",
    leaf: "#92c96c",
    name: "Sprout",
  },
  {
    level: 2,
    radius: 33.6,
    fill: "#8fb374",
    stroke: "#7a5332",
    accent: "#f1a7b4",
    leaf: "#77b85d",
    name: "Bud",
  },
  {
    level: 3,
    radius: 42,
    fill: "#ffe39f",
    stroke: "#7a5332",
    accent: "#f4b8c8",
    leaf: "#8fc76b",
    name: "Bloom",
  },
  {
    level: 4,
    radius: 51.45,
    fill: "#ffd77d",
    stroke: "#7a5332",
    accent: "#f29797",
    leaf: "#7fbf6d",
    name: "Garden Flower",
  },
  {
    level: 5,
    radius: 61.95,
    fill: "#ffd7e6",
    stroke: "#7a5332",
    accent: "#f49aaf",
    leaf: "#7fb26a",
    name: "Full Blossom Orb",
  },
  {
    level: 6,
    radius: 73.5,
    fill: "#fff0a8",
    stroke: "#7a5332",
    accent: "#cab8ff",
    leaf: "#9bcb9b",
    name: "Moon Crown Blossom",
  },
  {
    level: 7,
    radius: 92.4,
    fill: "#fff3b0",
    stroke: "#7a5332",
    accent: "#cdbeff",
    leaf: "#a9d39e",
    name: "Starlit Garden Core",
  },
]

const EARLY_POOL: BallLevel[] = [0, 0, 1, 1, 2]
const UNLOCKED_STAGE4_POOL: BallLevel[] = [0, 0, 1, 1, 2, 2, 3]
const STAGE4_UNLOCK_LEVEL: BallLevel = 3

let ballId = 0

export function getBallDefinition(level: BallLevel): BallDefinition {
  return BALL_DEFINITIONS[level]
}

export function getNextBallLevel(level: BallLevel): BallLevel | null {
  if (level >= 7) {
    return null
  }

  return (level + 1) as BallLevel
}

export function getSpawnBallLevel(maxFieldLevel: BallLevel | null = null): BallLevel {
  const pool =
    maxFieldLevel === null || maxFieldLevel < STAGE4_UNLOCK_LEVEL
      ? EARLY_POOL
      : UNLOCKED_STAGE4_POOL

  return pool[Math.floor(Math.random() * pool.length)]
}

export function createBallBody(x: number, y: number, level: BallLevel): BallBody {
  const definition = getBallDefinition(level)
  const body = Bodies.circle(x, y, definition.radius, {
    label: "ball",
    restitution: BALL_RESTITUTION + 0.02,
    friction: 0.035,
    frictionAir: BALL_FRICTION_AIR,
    density: BALL_DENSITY,
    frictionStatic: 0.13,
    slop: 0.01,
    sleepThreshold: BALL_SLEEP_THRESHOLD,
  }) as BallBody

  body.plugin.ball = {
    id: "ball-" + String(ballId++),
    level,
    mergeLocked: false,
    wallBounceArmed: false,
    launchTime: 0,
  }

  return body
}

export function isBallBody(body: MatterBody): body is BallBody {
  return Boolean((body as BallBody).plugin?.ball)
}

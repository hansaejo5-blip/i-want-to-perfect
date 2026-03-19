import { Bodies, type Body as MatterBody } from 'matter-js'
import {
  BOWL_BOTTOM,
  BOWL_LEFT_RIM_Y,
  BOWL_LEFT_X,
  BOWL_RIGHT_RIM_Y,
  BOWL_RIGHT_X,
  WALL_THICKNESS,
  WORLD_FLOOR_THICKNESS,
  WORLD_FLOOR_Y,
  WORLD_WIDTH,
} from '../config'

export interface BowlGeometry {
  leftX: number
  rightX: number
  bottom: number
  leftRimY: number
  rightRimY: number
  dangerStartX: number
  dangerStartY: number
  dangerEndX: number
  dangerEndY: number
}

export interface BowlSetup {
  geometry: BowlGeometry
  bodies: MatterBody[]
}

export function createBowlSetup(): BowlSetup {
  const wallOptions = {
    isStatic: true,
    restitution: 0.24,
    friction: 0.42,
    frictionStatic: 0.5,
    slop: 0.01,
    render: { visible: false },
  }

  const floorOptions = {
    isStatic: true,
    restitution: 0.02,
    friction: 0.84,
    frictionStatic: 1,
    slop: 0.01,
    render: { visible: false },
  }

  const leftWallHeight = BOWL_BOTTOM - BOWL_LEFT_RIM_Y
  const rightWallHeight = BOWL_BOTTOM - BOWL_RIGHT_RIM_Y

  const leftWall = Bodies.rectangle(
    BOWL_LEFT_X - WALL_THICKNESS / 2,
    BOWL_LEFT_RIM_Y + leftWallHeight / 2,
    WALL_THICKNESS,
    leftWallHeight + WALL_THICKNESS,
    wallOptions,
  )

  const rightWall = Bodies.rectangle(
    BOWL_RIGHT_X + WALL_THICKNESS / 2,
    BOWL_RIGHT_RIM_Y + rightWallHeight / 2,
    WALL_THICKNESS,
    rightWallHeight + WALL_THICKNESS,
    wallOptions,
  )

  leftWall.label = 'bowl-wall-left'
  rightWall.label = 'bowl-wall-right'

  const bowlFloor = Bodies.rectangle(
    (BOWL_LEFT_X + BOWL_RIGHT_X) / 2,
    BOWL_BOTTOM + WALL_THICKNESS / 2,
    BOWL_RIGHT_X - BOWL_LEFT_X + WALL_THICKNESS * 3,
    WALL_THICKNESS,
    floorOptions,
  )

  const leftSupportFloor = Bodies.rectangle(
    (BOWL_LEFT_X - WALL_THICKNESS) / 2,
    BOWL_BOTTOM + WALL_THICKNESS / 2,
    BOWL_LEFT_X + WALL_THICKNESS,
    WALL_THICKNESS,
    floorOptions,
  )

  const rightSupportWidth = WORLD_WIDTH - BOWL_RIGHT_X + WALL_THICKNESS
  const rightSupportFloor = Bodies.rectangle(
    BOWL_RIGHT_X + rightSupportWidth / 2,
    BOWL_BOTTOM + WALL_THICKNESS / 2,
    rightSupportWidth,
    WALL_THICKNESS,
    floorOptions,
  )

  const worldFloor = Bodies.rectangle(
    WORLD_WIDTH / 2,
    WORLD_FLOOR_Y,
    WORLD_WIDTH + WALL_THICKNESS * 4,
    WORLD_FLOOR_THICKNESS,
    floorOptions,
  )

  return {
    geometry: {
      leftX: BOWL_LEFT_X,
      rightX: BOWL_RIGHT_X,
      bottom: BOWL_BOTTOM,
      leftRimY: BOWL_LEFT_RIM_Y,
      rightRimY: BOWL_RIGHT_RIM_Y,
      dangerStartX: BOWL_LEFT_X,
      dangerStartY: BOWL_LEFT_RIM_Y,
      dangerEndX: BOWL_RIGHT_X,
      dangerEndY: BOWL_RIGHT_RIM_Y,
    },
    bodies: [
      leftWall,
      rightWall,
      bowlFloor,
      leftSupportFloor,
      rightSupportFloor,
      worldFloor,
    ],
  }
}

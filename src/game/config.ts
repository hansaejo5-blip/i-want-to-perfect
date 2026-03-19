export const WORLD_WIDTH = 1280
export const WORLD_HEIGHT = 720

export const FIXED_TIMESTEP_MS = 1000 / 60
export const MAX_PHYSICS_STEPS = 6
export const GAME_SPEED_MULTIPLIER = 1.2

export const CANNON_X = WORLD_WIDTH * 0.17
export const CANNON_Y = WORLD_HEIGHT * 0.8
export const CANNON_BASE_RADIUS = 28
export const CANNON_BARREL_LENGTH = 76
export const AIM_GUIDE_BASE_LENGTH = 40
export const AIM_GUIDE_MAX_LENGTH = 140
export const CANNON_MIN_ANGLE_DEG = -90
export const CANNON_MAX_ANGLE_DEG = 90

export const MIN_SHOT_POWER = 12.9
export const MAX_SHOT_POWER = 33.0
export const MIN_DRAG_DISTANCE = 20
export const MAX_DRAG_DISTANCE = 180
export const SHOOT_COOLDOWN_MS = 120

export const BOWL_LEFT_X = WORLD_WIDTH * 0.56
export const BOWL_RIGHT_X = WORLD_WIDTH * 0.95
export const BOWL_BOTTOM = WORLD_HEIGHT * 0.86
export const BOWL_LEFT_RIM_Y = BOWL_BOTTOM - WORLD_HEIGHT * 0.22
export const BOWL_RIGHT_RIM_Y = BOWL_BOTTOM - WORLD_HEIGHT * 0.58
export const WALL_THICKNESS = 20
export const RIM_THICKNESS = 14

export const DANGER_LINE_Y = BOWL_BOTTOM - (BOWL_BOTTOM - BOWL_RIGHT_RIM_Y) * 0.42
export const DANGER_DURATION_MS = 3000

export const WORLD_FLOOR_Y = WORLD_HEIGHT + 18
export const WORLD_FLOOR_THICKNESS = 84

export const BALL_RADIUS = 18
export const BALL_RESTITUTION = 0.08
export const BALL_FRICTION = 0.08
export const BALL_FRICTION_AIR = 0.017
export const BALL_DENSITY = 0.0014
export const BALL_SLEEP_THRESHOLD = 38

export const BACKGROUND_TOP = '#f7efdf'
export const BACKGROUND_BOTTOM = '#ead8bf'

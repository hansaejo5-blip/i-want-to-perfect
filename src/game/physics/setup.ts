import { Composite, Engine } from 'matter-js'
import { GAME_SPEED_MULTIPLIER } from '../config'
import { createBowlSetup } from '../world/bowl'

export function createPhysicsEngine() {
  const engine = Engine.create({
    enableSleeping: true,
    gravity: { x: 0, y: 1, scale: 0.00135 },
    positionIterations: 12,
    velocityIterations: 10,
    constraintIterations: 3,
  })

  engine.timing.timeScale = GAME_SPEED_MULTIPLIER

  const bowl = createBowlSetup()
  Composite.add(engine.world, bowl.bodies)

  return {
    engine,
    bowl,
  }
}

import * as constants from '../constants.js'

const world = {
  scale: 1,
  iconWidth: constants.ICON_WIDTH,
  iconHeight: constants.ICON_HEIGHT,
  speed: constants.SPEED,
  conversionRadius: constants.CONVERSION_RADIUS,
  repulsionRadius: constants.REPULSION_RADIUS,
  edgeAvoidRadius: constants.EDGE_AVOID_RADIUS,
  flipThreshold: constants.FLIP_THRESHOLD,
  wobbleAmount: constants.WOBBLE_AMOUNT,
}

export function getWorldMetrics() {
  return world
}

export function setWorldScale(scale) {
  // Only hitboxes / interaction radii scale with the playfield.
  // Visual size, movement speed, and wobble stay at the original constants.
  const nextScale = Math.max(constants.MIN_WORLD_SCALE, scale)
  world.scale = nextScale
  world.iconWidth = constants.ICON_WIDTH
  world.iconHeight = constants.ICON_HEIGHT
  world.speed = constants.SPEED
  world.conversionRadius = constants.CONVERSION_RADIUS * nextScale
  world.repulsionRadius = constants.REPULSION_RADIUS * nextScale
  world.edgeAvoidRadius = constants.EDGE_AVOID_RADIUS * nextScale
  world.flipThreshold = constants.FLIP_THRESHOLD
  world.wobbleAmount = constants.WOBBLE_AMOUNT
  return nextScale
}

export default class Entity {
  constructor(x, y, type, speedMultiplier = 1) {
    this.x = x
    this.y = y
    this.type = type
    this.size = world.iconWidth
    this.speedMultiplier = speedMultiplier
    this.wobbleOffset = 0
    this.wobbleDirection = 1
    this.wobblePhase = Math.random() * Math.PI * 2
    this.facingRight = true
    this.lastStableX = x
    this.dt = 0
  }

  updateWobble() {
    this.wobblePhase += constants.WOBBLE_SPEED
    this.wobbleOffset = Math.sin(this.wobblePhase) * world.wobbleAmount
  }

  updateDirection() {
    const xMovement = this.x - this.lastStableX

    if (Math.abs(xMovement) > world.flipThreshold) {
      this.facingRight = xMovement > 0
      this.lastStableX = this.x
    }
  }

  moveTowards(canvasSize, targetX, targetY, deltaTime) {
    this.dt = deltaTime
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    const speed = world.speed * this.speedMultiplier * this.getRandomUniform(0.8, 1.2)

    this.x += speed * deltaTime * Math.cos(angle)
    this.y += speed * deltaTime * Math.sin(angle)
    this.clampToBounds(canvasSize)
  }

  moveAwayFrom(canvasSize, targetX, targetY, deltaTime) {
    this.dt = deltaTime
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    const speed = world.speed * this.speedMultiplier * this.getRandomUniform(0.8, 1.2)

    this.x -= speed * deltaTime * Math.cos(angle)
    this.y -= speed * deltaTime * Math.sin(angle)
    this.clampToBounds(canvasSize)
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y)
  }

  repelFrom(canvasSize, other, deltaTime) {
    if (this.distanceTo(other) < world.repulsionRadius) {
      this.moveAwayFrom(canvasSize, other.x, other.y, deltaTime)
    }
  }

  clampToBounds(canvasSize) {
    const edge = world.edgeAvoidRadius
    const maxX = Math.max(edge, canvasSize[0] - edge)
    const maxY = Math.max(edge, canvasSize[1] - edge)
    this.x = Math.min(Math.max(this.x, edge), maxX)
    this.y = Math.min(Math.max(this.y, edge), maxY)
  }

  getRandomUniform(min, max) {
    return Math.random() * (max - min) + min
  }
}

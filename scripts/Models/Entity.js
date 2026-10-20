import * as constants from '../constants.js'

export default class Entity {
  constructor(x, y, type, speedMultiplier = 1) {
    this.x = x
    this.y = y
    this.type = type
    this.size = constants.ICON_WIDTH
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
    this.wobbleOffset = Math.sin(this.wobblePhase) * constants.WOBBLE_AMOUNT
  }

  updateDirection() {
    const xMovement = this.x - this.lastStableX

    if (Math.abs(xMovement) > constants.FLIP_THRESHOLD) {
      this.facingRight = xMovement > 0
      this.lastStableX = this.x
    }
  }

  moveTowards(canvasSize, targetX, targetY, deltaTime) {
    this.dt = deltaTime
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    const speed = constants.SPEED * this.speedMultiplier * this.getRandomUniform(0.8, 1.2)

    this.x += speed * deltaTime * Math.cos(angle)
    this.y += speed * deltaTime * Math.sin(angle)
    this.clampToBounds(canvasSize)
  }

  moveAwayFrom(canvasSize, targetX, targetY, deltaTime) {
    this.dt = deltaTime
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    const speed = constants.SPEED * this.speedMultiplier * this.getRandomUniform(0.8, 1.2)

    this.x -= speed * deltaTime * Math.cos(angle)
    this.y -= speed * deltaTime * Math.sin(angle)
    this.clampToBounds(canvasSize)
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y)
  }

  repelFrom(canvasSize, other, deltaTime) {
    if (this.distanceTo(other) < constants.REPULSION_RADIUS) {
      this.moveAwayFrom(canvasSize, other.x, other.y, deltaTime)
    }
  }

  clampToBounds(canvasSize) {
    const maxX = Math.max(constants.EDGE_AVOID_RADIUS, canvasSize[0] - constants.EDGE_AVOID_RADIUS)
    const maxY = Math.max(constants.EDGE_AVOID_RADIUS, canvasSize[1] - constants.EDGE_AVOID_RADIUS)
    this.x = Math.min(Math.max(this.x, constants.EDGE_AVOID_RADIUS), maxX)
    this.y = Math.min(Math.max(this.y, constants.EDGE_AVOID_RADIUS), maxY)
  }

  getRandomUniform(min, max) {
    return Math.random() * (max - min) + min
  }
}

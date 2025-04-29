import * as constants from '../constants.js'

export default class Entity {
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type
    this.size = constants.ICON_WIDTH
    this.wobbleOffset = 0
    this.wobbleDirection = 1
    this.wobblePhase = Math.random() * Math.PI * 2
    this.facingRight = true
    this.lastStableX = x
  }

  updateWobble() {
    // Update wobble phase (creates oscillation)
    this.wobblePhase += constants.WOBBLE_SPEED
    this.wobbleOffset = Math.sin(this.wobblePhase) * constants.WOBBLE_AMOUNT
  }

  updateDirection() {
    const xMovement = this.x - this.lastStableX

    // Only flip if movement exceeds threshold
    if (Math.abs(xMovement) > constants.FLIP_THRESHOLD) {
      this.facingRight = xMovement > 0
      this.lastStableX = this.x // Update only after significant movement
    }
  }

  moveTowards(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    this.x += (constants.SPEED + Math.random() + this.getRandomUniform(-0.2, 0.2)) * Math.cos(angle)
    this.y += (constants.SPEED + Math.random() + this.getRandomUniform(-0.2, 0.2)) * Math.sin(angle)
    this.avoidEdges()
  }

  moveAwayFrom(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    this.x -= (constants.SPEED + Math.random() + this.getRandomUniform(-0.2, 0.2)) * Math.cos(angle)
    this.y -= (constants.SPEED + Math.random() + this.getRandomUniform(-0.2, 0.2)) * Math.sin(angle)
    this.avoidEdges()
  }

  distanceTo(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  repelFrom(other) {
    if (this.distanceTo(other) < constants.REPULSION_RADIUS) {
      this.moveAwayFrom(other.x, other.y)
    }
  }

  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, constants.ENTITY_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = colors[this.type]
    ctx.fill()
    ctx.closePath()

    // If images were loaded, we would use this:
    // ctx.drawImage(this.img, this.x - ICON_WIDTH / 2, this.y - ICON_HEIGHT / 2, ICON_WIDTH, ICON_HEIGHT);
    ctx.restore()
  }

  avoidEdges() {
    if (this.x < constants.EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x + constants.EDGE_AVOID_RADIUS, this.y)
    } else if (this.x > constants.WINDOW_WIDTH - constants.EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x - constants.EDGE_AVOID_RADIUS, this.y)
    }
    if (this.y < constants.EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x, this.y + constants.EDGE_AVOID_RADIUS)
    } else if (this.y > constants.WINDOW_HEIGHT - constants.EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x, this.y - constants.EDGE_AVOID_RADIUS)
    }
  }

  getRandomUniform(min, max) {
    return Math.random() * (max - min) + min
  }
}

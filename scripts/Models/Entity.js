import * as constants from '../constants.js'

export default class Entity {
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type
    this.size = 52
  }

  // constructor(x, y, tribe) {
  //   this.x = x
  //   this.y = y
  //   this.tribe = tribe
  //   this.img = new Image()
  //   this.img.src = `${tribe}.png`
  // }

  moveTowards(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    this.x += (constants.SPEED + Math.random() * 0.6 - 0.3) * Math.cos(angle)
    this.y += (constants.SPEED + Math.random() * 0.6 - 0.3) * Math.sin(angle)
    this.avoidEdges()
  }

  moveAwayFrom(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x)
    this.x -= (constants.SPEED + Math.random() * 0.6 - 0.3) * Math.cos(angle)
    this.y -= (constants.SPEED + Math.random() * 0.6 - 0.3) * Math.sin(angle)
    this.avoidEdges()
  }

  distanceTo(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  repelFrom(other) {
    if (this.distanceTo(other) < REPULSION_RADIUS) {
      this.moveAwayFrom(other.x, other.y)
    }
  }

  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, ENTITY_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = colors[this.tribe]
    ctx.fill()
    ctx.closePath()

    // If images were loaded, we would use this:
    // ctx.drawImage(this.img, this.x - ICON_WIDTH / 2, this.y - ICON_HEIGHT / 2, ICON_WIDTH, ICON_HEIGHT);
    ctx.restore()
  }

  avoidEdges() {
    if (this.x < EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x + EDGE_AVOID_RADIUS, this.y)
    } else if (this.x > WINDOW_WIDTH - EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x - EDGE_AVOID_RADIUS, this.y)
    }
    if (this.y < EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x, this.y + EDGE_AVOID_RADIUS)
    } else if (this.y > WINDOW_HEIGHT - EDGE_AVOID_RADIUS) {
      this.moveTowards(this.x, this.y - EDGE_AVOID_RADIUS)
    }
  }
}

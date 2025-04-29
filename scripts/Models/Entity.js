import * as constants from '../constants.js'

export default class Entity {
  constructor(x, y, type) {
    this.x = x
    this.y = y
    this.type = type
    this.size = 52
  }

  draw() {
    // self.ctx.fillStyle = this.color
    // ctx.fillRect(this.x, this.y, this.size, this.size)
    // this.ctx.drawImage(this.image, this.x, this.y)
  }

  move_towards(canvas, target_x, target_y) {
    let angle = Math.atan2(target_y - this.y, target_x - this.x)
    this.x += constants.SPEED + this.getRandomUniform(-0.3, 0.3) * Math.cos(angle)
    this.y += constants.SPEED + this.getRandomUniform(-0.3, 0.3) * Math.sin(angle)
    this.avoid_edges(canvas)
  }

  move_away_from(canvas, target_x, target_y) {
    let angle = Math.atan2(target_y - this.y, target_x - this.x)
    this.x -= (constants.SPEED + this.getRandomUniform(-0.3, 0.3)) * Math.cos(angle)
    this.y -= (constants.SPEED + this.getRandomUniform(-0.3, 0.3)) * Math.sin(angle)
    this.avoid_edges(canvas)
  }

  distance_to(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  repel_from(other) {
    if (this.distance_to(other) < constants.REPULSION_RADIUS) {
      this.move_away_from(other.x, other.y)
    }
  }

  // draw(self) {
  // if (self.tribe == 'rock') {
  //     screen.blit(rock_icon, (self.x - ICON_WIDTH//2, self.y - ICON_HEIGHT//2))
  //     }
  // elif self.tribe == 'paper':
  //     screen.blit(paper_icon, (self.x - ICON_WIDTH//2, self.y - ICON_HEIGHT//2))
  // else:
  //     screen.blit(scissors_icon, (self.x - ICON_WIDTH//2, self.y - ICON_HEIGHT//2))
  // }

  avoid_edges(canvas) {
    if (this.x < constants.EDGE_AVOID_RADIUS) {
      this.move_towards(this.x + constants.EDGE_AVOID_RADIUS, this.y)
    } else if (self.x > canvas.width - constants.EDGE_AVOID_RADIUS) {
      this.move_towards(this.x - constants.EDGE_AVOID_RADIUS, this.y)
    }
    if (this.y < constants.EDGE_AVOID_RADIUS) {
      this.move_towards(this.x, this.y + constants.EDGE_AVOID_RADIUS)
    } else if (self.y > canvas.height - constants.EDGE_AVOID_RADIUS) {
      this.move_towards(this.x, this.y - constants.EDGE_AVOID_RADIUS)
    }
  }

  getRandomUniform(min, max) {
    return Math.random() * (max - min) + min
  }
}

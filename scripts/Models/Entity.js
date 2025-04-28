import * as constants from './constants.js'

export class Entity {
  constructor(ctx, x, y, type, image) {
    this.ctx = ctx
    this.x = x
    this.y = y
    this.type = type
    this.image = image
  }

  draw() {
    this.ctx.fillStyle = this.color
    // ctx.fillRect(this.x, this.y, this.size, this.size)
    this.ctx.drawImage(this.image, this.x, this.y)
  }

  move_towards(self, target_x, target_y) {
    angle = math.atan2(target_y - self.y, target_x - self.x)
    self.x += (constants.SPEED + random.uniform(-0.3, 0.3)) * math.cos(angle)
    self.y += (constants.SPEED + random.uniform(-0.3, 0.3)) * math.sin(angle)
    self.avoid_edges()
  }

  move_away_from(self, target_x, target_y) {
    angle = math.atan2(target_y - self.y, target_x - self.x)
    self.x -= (constants.SPEED + random.uniform(-0.3, 0.3)) * math.cos(angle)
    self.y -= (constants.SPEED + random.uniform(-0.3, 0.3)) * math.sin(angle)
    self.avoid_edges()
  }

  distance_to(self, other) {
    return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)
  }

  repel_from(self, other) {
    if (self.distance_to(other) < constants.REPULSION_RADIUS) {
      self.move_away_from(other.x, other.y)
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

  avoid_edges(self) {
    if (self.x < constants.EDGE_AVOID_RADIUS) {
      self.move_towards(self.x + constants.EDGE_AVOID_RADIUS, self.y)
    } else if (self.x > constants.WINDOW_WIDTH - constants.EDGE_AVOID_RADIUS) {
      self.move_towards(self.x - constants.EDGE_AVOID_RADIUS, self.y)
    }
    if (self.y < constants.EDGE_AVOID_RADIUS) {
      self.move_towards(self.x, self.y + constants.EDGE_AVOID_RADIUS)
    } else if (self.y > constants.WINDOW_HEIGHT - constants.EDGE_AVOID_RADIUS) {
      self.move_towards(self.x, self.y - constants.EDGE_AVOID_RADIUS)
    }
  }
}

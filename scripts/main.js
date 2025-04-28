import * as constants from './constants.js'
import Entity from './Models/Entity.js'

// Setup
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const player = {
  x: 50,
  y: 50,
  size: 30,
  color: 'blue',
  speed: 5,
}

const enemies = []
for (let i = 0; i < 5; i++) {
  enemies.push({
    x: Math.random() * 470,
    y: Math.random() * 470,
    size: 30,
    color: 'red',
    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4,
  })
}

let keys = {}

// Event listeners for player movement
document.addEventListener('keydown', (e) => {
  keys[e.key] = true
})

document.addEventListener('keyup', (e) => {
  keys[e.key] = false
})

// Update player and enemy positions
function update() {
  if (keys['ArrowUp']) player.y -= player.speed
  if (keys['ArrowDown']) player.y += player.speed
  if (keys['ArrowLeft']) player.x -= player.speed
  if (keys['ArrowRight']) player.x += player.speed

  // Keep player inside the canvas
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x))
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y))

  enemies.forEach((enemy) => {
    enemy.x += enemy.dx
    enemy.y += enemy.dy

    // Bounce off walls
    if (enemy.x <= 0 || enemy.x + enemy.size >= canvas.width) enemy.dx *= -1
    if (enemy.y <= 0 || enemy.y + enemy.size >= canvas.height) enemy.dy *= -1
  })
}

entities = []
for (let i = 0; i < 50; i++) {
  entities.append(Entity(random.randint(0, WINDOW_WIDTH), random.randint(0, WINDOW_HEIGHT), 'cow', 'image'))
  entities.append(Entity(random.randint(0, WINDOW_WIDTH), random.randint(0, WINDOW_HEIGHT), 'sheep', 'image'))
  entities.append(Entity(random.randint(0, WINDOW_WIDTH), random.randint(0, WINDOW_HEIGHT), 'wolf', 'image'))
}

function adjust_movement() {
  targets = []
  threats = []
  for (entity in entities) {
    if (entity.type == 'cow') {
      for (e of entities) {
        if (e.type == 'scissors') {
          targets.append(e)
        } else if (e.type == 'paper') {
          threats.append(e)
        }
      }
    } else if (entity.type == 'sheep') {
      for (e of entities) {
        if (e.type == 'rock') {
          targets.append(e)
        } else if (e.type == 'scissors') {
          threats.append(e)
        }
      }
    } else {
      for (e of entities) {
        if (e.type == 'rock') {
          targets.append(e)
        } else if (e.type == 'scissors') {
          threats.append(e)
        }
      }
    }

    for (other in entities) {
      if (entity != other && entity.type == other.type) {
        entity.repel_from(other)
      }
    }

    let closest_target =
      targets.length > 0
        ? targets.reduce((min, t) => (entity.distance_to(t) < entity.distance_to(min) ? t : min), targets[0])
        : null

    let closest_threat =
      threats.length > 0
        ? threats.reduce((min, t) => (entity.distance_to(t) < entity.distance_to(min) ? t : min), threats[0])
        : null

    if (closest_threat && entity.distance_to(closest_threat) < DETECTION_RADIUS) {
      entity.move_away_from(closest_threat.x, closest_threat.y)
    } else if (closest_target && entity.distance_to(closest_target) < DETECTION_RADIUS) {
      entity.move_towards(closest_target.x, closest_target.y)
      if (entity.distance_to(closest_target) < CONVERSION_RADIUS) {
        closest_target.tribe = entity.tribe
      }
    } else {
      tity.move_towards(random.randint(0, WINDOW_WIDTH), random.randint(0, WINDOW_HEIGHT))
    }

    entity.draw()
  }
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw player
  ctx.fillStyle = player.color
  ctx.fillRect(player.x, player.y, player.size, player.size)

  // Draw enemies
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size)
  })
}

// Game loop
function gameLoop() {
  adjust_movement()

  // rock_count = sum(1 for entity in entities if entity.tribe == 'rock')
  // paper_count = sum(1 for entity in entities if entity.tribe == 'paper')
  // scissors_count = sum(1 for entity in entities if entity.tribe == 'scissors')

  // winner_text = None
  // if rock_count == len(entities):
  //     winner_text = "Rock"
  // elif paper_count == len(entities):
  //     winner_text = "Paper"
  // elif scissors_count == len(entities):
  //     winner_text = "Scissors"
  // draw()
  requestAnimationFrame(gameLoop)
}

// Start the game
gameLoop()

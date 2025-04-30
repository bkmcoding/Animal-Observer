import * as constants from './constants.js'
import Entity from './Models/Entity.js'

let first = 0

// Setup
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
let CANVAS_SIZE = [1920, 1080]
let gameMusic = document.querySelector('.battleMusic')
let gameStart = false
// WINDOW_WIDTH = 1920
// WINDOW_HEIGHT = 1080

// Image cache
const imageCache = {}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (imageCache[url]) {
      resolve(imageCache[url])
      return
    }

    const img = new Image()
    img.onload = () => {
      imageCache[url] = img
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

// Preload all images
async function preloadImages() {
  const types = Object.values(constants.ANIMAL_TYPES)
  const imageUrls = types.map((t) => t.image).filter((url) => url)

  try {
    await Promise.all(imageUrls.map(loadImage))
    console.log('All images loaded')
  } catch (error) {
    console.error('Error loading images:', error)
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const entities = []
// const queuedEntities = []
const tribes = ['cow', 'wolf', 'sheep']

for (let i = 0; i < 10; i++) {
  for (const tribe of tribes) {
    entities.push(new Entity(Math.random() * CANVAS_SIZE[0], Math.random() * CANVAS_SIZE[1], tribe))
  }
}

function adjustMovement() {
  ctx.clearRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1])

  // Draw background (in a real implementation, you'd draw an image here)
  // ctx.fillStyle = '#333'
  // ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT)

  for (const entity of entities) {
    let targets, threats

    if (entity.type === 'cow') {
      targets = entities.filter((e) => e.type === 'wolf')
      threats = entities.filter((e) => e.type === 'sheep')
    } else if (entity.type === 'sheep') {
      targets = entities.filter((e) => e.type === 'cow')
      threats = entities.filter((e) => e.type === 'wolf')
    } else {
      targets = entities.filter((e) => e.type === 'sheep')
      threats = entities.filter((e) => e.type === 'cow')
    }

    // Repel from same tribe
    for (const other of entities) {
      if (entity !== other && entity.type === other.type) {
        entity.repelFrom(CANVAS_SIZE, other)
      }
    }

    // Find closest target and threat
    let closestTarget =
      targets.length > 0
        ? targets.reduce((closest, current) =>
            entity.distanceTo(current) < entity.distanceTo(closest) ? current : closest
          )
        : null

    let closestThreat =
      threats.length > 0
        ? threats.reduce((closest, current) =>
            entity.distanceTo(current) < entity.distanceTo(closest) ? current : closest
          )
        : null

    // Movement logic
    if (closestThreat && entity.distanceTo(closestThreat) < constants.DETECTION_RADIUS) {
      entity.moveAwayFrom(CANVAS_SIZE, closestThreat.x, closestThreat.y)
    } else if (closestTarget && entity.distanceTo(closestTarget) < constants.DETECTION_RADIUS) {
      entity.moveTowards(CANVAS_SIZE, closestTarget.x, closestTarget.y)
      if (entity.distanceTo(closestTarget) < constants.CONVERSION_RADIUS) {
        // closestTarget.type = entity.type
        if (Math.random() < 0.5) {
          entity.x = Math.random() * CANVAS_SIZE[0]
          if (Math.random() < 0.5) {
            entity.y = -200
          } else {
            entity.y = CANVAS_SIZE[1] + 200
          }
        } else {
          entity.y = Math.random() * CANVAS_SIZE[1]
          if (Math.random() < 0.5) {
            entity.x = -200
          } else {
            entity.x = CANVAS_SIZE[0] + 200
          }
        }
      }
    } else {
      entity.moveTowards(CANVAS_SIZE, Math.random() * CANVAS_SIZE[0], Math.random() * CANVAS_SIZE[1])
    }

    draw(entity)
  }
}

// Draw everything
function draw(entity) {
  entity.updateWobble()
  entity.updateDirection()
  // ctx.clearRect(0, 0, canvas.width, canvas.height)

  // // Draw player
  // ctx.fillStyle = player.color
  // ctx.fillRect(player.x, player.y, player.size, player.size)

  // // Draw enemies
  // enemies.forEach((enemy) => {
  //   ctx.fillStyle = enemy.color
  //   ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size)
  // })
  // Draw image instead of emoji
  const img = imageCache[constants.ANIMAL_TYPES[entity.type].image]
  if (img) {
    // Calculate size while maintaining aspect ratio
    const aspect = img.width / img.height
    const width = entity.size * 2
    const height = width / aspect

    ctx.save()

    // ctx.translate(entity.x, entity.y)

    // Apply directional rotation (adjusted for right-facing images)
    // ctx.rotate(entity.facingAngle)

    // Apply wobble by slightly rotating the image back and forth
    const rotationAngle = Math.sin(entity.wobblePhase) * 0.2 // Small rotation (in radians)

    // Move to entity position and apply rotation
    ctx.translate(entity.x, entity.y)
    if (!entity.facingRight) {
      ctx.scale(-1, 1) // Mirror horizontally
    }
    ctx.rotate(rotationAngle)

    // Draw image (adjusted pivot for right-facing)
    ctx.drawImage(
      img,
      entity.facingRight ? -constants.ICON_WIDTH / 2 : -constants.ICON_WIDTH / 2,
      -constants.ICON_HEIGHT / 2 + entity.wobbleOffset / 2,
      constants.ICON_WIDTH,
      constants.ICON_HEIGHT
    )

    ctx.restore()

    // ctx.save()

    // // Apply wobble by slightly rotating the image back and forth
    // const rotationAngle = Math.sin(entity.wobblePhase) * 0.2 // Small rotation (in radians)

    // // Move to entity position and apply rotation
    // ctx.translate(entity.x, entity.y)
    // ctx.rotate(rotationAngle)

    // // Draw the image centered with wobble effect
    // ctx.drawImage(
    //   img,
    //   -constants.ICON_WIDTH / 2,
    //   -constants.ICON_HEIGHT / 2 + entity.wobbleOffset / 2, // Vertical wobble
    //   constants.ICON_WIDTH,
    //   constants.ICON_HEIGHT
    // )
    // ctx.restore()
    // ctx.restore()
    // ctx.drawImage(img, entity.x, entity.y)
    // ctx.restore()
    // ctx.fillStyle = entity.color
    // console.log('Drawing entity:', entity)
    // ctx.fillRect(entity.x, entity.y, entity.size, entity.size)
    ctx.restore()
  } else {
    // Fallback to colored circle if image not loaded
    ctx.fillStyle = entity.color
    ctx.beginPath()
    ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
    ctx.fill()
  }
  // ctx.drawImage(entity.image, entity.x, entity.y)
}

await preloadImages()
// gameMusic.play()
// gameMusic.loop = true
// gameMusic.volume = 0.5

// Game loop
async function gameLoop() {
  gameStart = true
  CANVAS_SIZE[0] = window.innerWidth
  CANVAS_SIZE[1] = window.innerHeight - 340
  canvas.width = CANVAS_SIZE[0]
  canvas.height = CANVAS_SIZE[1]

  // loadAnimation()
  // ctx.clearRect(0, 0, canvas.width, canvas.height)
  adjustMovement()

  if (gameStart) {
    requestAnimationFrame(gameLoop)
  }
}

// Start the game
gameLoop()

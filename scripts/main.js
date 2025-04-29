import * as constants from './constants.js'
import Entity from './Models/Entity.js'

let first = 0

// Setup
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

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
const tribes = ['cow', 'wolf', 'sheep']

for (let i = 0; i < 50; i++) {
  for (const tribe of tribes) {
    entities.push(new Entity(Math.random() * WINDOW_WIDTH, Math.random() * WINDOW_HEIGHT, tribe))
  }
}

function adjustMovement() {
  ctx.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT)

  // Draw background (in a real implementation, you'd draw an image here)
  // ctx.fillStyle = '#333'
  // ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT)

  for (const entity of entities) {
    let targets, threats

    if (entity.tribe === 'rock') {
      targets = entities.filter((e) => e.tribe === 'scissors')
      threats = entities.filter((e) => e.tribe === 'paper')
    } else if (entity.tribe === 'paper') {
      targets = entities.filter((e) => e.tribe === 'rock')
      threats = entities.filter((e) => e.tribe === 'scissors')
    } else {
      // scissors
      targets = entities.filter((e) => e.tribe === 'paper')
      threats = entities.filter((e) => e.tribe === 'rock')
    }

    // Repel from same tribe
    for (const other of entities) {
      if (entity !== other && entity.tribe === other.tribe) {
        entity.repelFrom(other)
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
    if (closestThreat && entity.distanceTo(closestThreat) < DETECTION_RADIUS) {
      entity.moveAwayFrom(closestThreat.x, closestThreat.y)
    } else if (closestTarget && entity.distanceTo(closestTarget) < DETECTION_RADIUS) {
      entity.moveTowards(closestTarget.x, closestTarget.y)
      if (entity.distanceTo(closestTarget) < CONVERSION_RADIUS) {
        closestTarget.tribe = entity.tribe
      }
    } else {
      entity.moveTowards(Math.random() * WINDOW_WIDTH, Math.random() * WINDOW_HEIGHT)
    }

    draw(entity)
  }
}

// Draw everything
function draw(entity) {
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
    // Flip image if moving left
    // if (creature.x < 0) {
    //     ctx.translate(creature.x * 2, 0);
    //     ctx.scale(-1, 1);
    // }
    // ctx.drawImage(img,
    //   entity.dx < 0 ? -entity.x : entity.x - width/2,
    //   entity.y - entity/2,
    //     width,
    //     height
    // );
    ctx.drawImage(img, entity.x, entity.y)
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
// Game loop
async function gameLoop() {
  // ctx.clearRect(0, 0, canvas.width, canvas.height)
  adjust_movement()

  requestAnimationFrame(gameLoop)
}

// Start the game
gameLoop()

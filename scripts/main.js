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

let entities = []
for (let i = 0; i < 20; i++) {
  entities.push(new Entity(getRandomInt(0, canvas.width), getRandomInt(0, canvas.height), 'cow'))
  entities.push(new Entity(getRandomInt(0, canvas.width), getRandomInt(0, canvas.height), 'sheep'))
  entities.push(new Entity(getRandomInt(0, canvas.width), getRandomInt(0, canvas.height), 'wolf'))
}

function adjust_movement() {
  // for (const entity in entities) {
  entities.forEach((entity) => {
    let targets = []
    let threats = []
    if (entity.type == 'cow') {
      entities.forEach((e) => {
        if (e.type == 'wolf') {
          targets.push(e)
        } else if (e.type == 'sheep') {
          threats.push(e)
        }
      })
    } else if (entity.type == 'sheep') {
      entities.forEach((e) => {
        if (e.type == 'cow') {
          targets.push(e)
        } else if (e.type == 'wolf') {
          threats.push(e)
        }
      })
    } else {
      entities.forEach((e) => {
        if (e.type == 'sheep') {
          targets.push(e)
        } else if (e.type == 'cow') {
          threats.push(e)
        }
      })
    }

    // for (const other in entities) {
    entities.forEach((other) => {
      if (entity != other && entity.type == other.type) {
        // entity.repel_from(other)
      }
    })

    // let closest_target = null
    // let closest_threat = null
    // let minDist = Infinity
    // for (const target of targets ?? []) {
    //   const dist = entity.distance_to(target)
    //   if (dist < minDist) [closest, minDist] = [target, dist]
    // }
    // for (const threat of threats ?? []) {
    //   const dist = entity.distance_to(threat)
    //   if (dist < minDist) [closest, minDist] = [threat, dist]
    // }

    let closest_target = targets?.length
      ? [...targets].sort((a, b) => entity.distance_to(a) - entity.distance_to(b))[0]
      : null

    let closest_threat = threats?.length
      ? [...threats].sort((a, b) => entity.distance_to(a) - entity.distance_to(b))[0]
      : null

    if (500 % first == 0) {
      console.log('Targets:', targets)
      console.log('Threats:', threats)
      console.log(closest_target)
      console.log(closest_threat)
      first += 1
    }

    if (closest_threat && entity.distance_to(closest_threat) < constants.DETECTION_RADIUS) {
      entity.move_away_from(canvas, closest_threat.x, closest_threat.y)
    } else if (closest_target && entity.distance_to(closest_target) < constants.DETECTION_RADIUS) {
      entity.move_towards(canvas, closest_target.x, closest_target.y)
      if (entity.distance_to(closest_target) < constants.CONVERSION_RADIUS) {
        // closest_target.type = entity.type
      }
    } else {
      // entity.move_towards(canvas, getRandomInt(0, canvas.width), getRandomInt(0, canvas.height))
    }

    draw(entity)
  })
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
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  adjust_movement()

  requestAnimationFrame(gameLoop)
}

// Start the game
gameLoop()

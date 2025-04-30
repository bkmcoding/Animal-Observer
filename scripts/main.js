import * as constants from './constants.js'
import Entity from './Models/Entity.js'

let first = 0

// Setup
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const explosion = new Audio('./assets/sound/soundfx/explosion.wav')
explosion.volume = 0.7
let CANVAS_SIZE = [1920, 1080]
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
const animals = ['cow', 'wolf', 'sheep']
let wolfEaten = 0
let sheepEaten = 0
let cowEaten = 0

function generateEntities() {
  for (let i = 0; i < 5; i++) {
    for (const animal of animals) {
      entities.push(new Entity(Math.random() * CANVAS_SIZE[0], Math.random() * CANVAS_SIZE[1], animal))
    }
  }
  checkTouching()
}

function checkTouching() {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entityA = entities[i]
      const entityB = entities[j]

      if (entityA.distanceTo(entityB) < constants.ICON_WIDTH) {
        entityB.x = Math.random() * CANVAS_SIZE[0]
        entityB.y = Math.random() * CANVAS_SIZE[1]
      }
    }
  }
}

generateEntities()

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
        explosion.play()
        if (closestTarget.type === 'wolf') {
          wolfEaten++
        } else if (closestTarget.type === 'sheep') {
          sheepEaten++
        } else if (closestTarget.type === 'cow') {
          cowEaten++
        }
        for (let i = 0; i < 30; i++) {
          bloodParticles.push(new BloodParticle(closestTarget.x, closestTarget.y))
        }
        if (Math.random() < 0.5) {
          closestTarget.x = Math.random() * CANVAS_SIZE[0]
          if (Math.random() < 0.5) {
            closestTarget.y = -200
          } else {
            closestTarget.y = CANVAS_SIZE[1] + 200
          }
        } else {
          closestTarget.y = Math.random() * CANVAS_SIZE[1]
          if (Math.random() < 0.5) {
            closestTarget.x = -200
          } else {
            closestTarget.x = CANVAS_SIZE[0] + 200
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
  } else {
    // Fallback to colored circle if image not loaded
    ctx.fillStyle = entity.color
    ctx.beginPath()
    ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
    ctx.fill()
  }
  // ctx.drawImage(entity.image, entity.x, entity.y)
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

await preloadImages()

const backgroundMusic = new Audio('./assets/sound/music/feedthemachine.mp3')

// Play music
function playBackgroundMusic() {
  backgroundMusic.loop = true
  backgroundMusic.volume = 0.1
  backgroundMusic.play().catch((e) => console.log('Audio play failed:', e))
}

// UI assets

const menuLogo = document.querySelector('#menu')
const startButton = document.querySelector('#startGameButton')
const settingsButton = document.querySelector('#settingsButton')
const cloudButton = document.querySelector('#cloudButton')
const tutorialScreen = document.querySelector('#tutorialScreen')

startButton.addEventListener('click', async () => {
  menuLogo.style.top = '20%'
  menuLogo.style.animation = 'fadeOut 2s forwards'
  startButton.style.animation = 'fadeOut 2s forwards'
  startButton.style.hover = 'none'
  setTimeout(function () {
    menuLogo.style.display = 'none'
  }, 2000)
  tutorialScreen.style.animation = 'dropAndBounce 2s ease-out forwards'
  tutorialScreen.style.display = 'block'
})

settingsButton.addEventListener('click', () => {
  console.log('Settings button clicked')
})

cloudButton.addEventListener('click', () => {
  tutorialScreen.style.top = '20%'
  tutorialScreen.style.animation = 'fadeOut 2s forwards'
  beginGameCountdown()
  setTimeout(function () {
    gameStart = true
    requestAnimationFrame(gameLoop)
    tutorialScreen.style.display = 'none'
    roundCountdown()
  }, 3200)
})

const gameCountdown = document.querySelector('#gameCountdown')
const roundLength = 45
function beginGameCountdown() {
  let count = 3
  const interval = setInterval(() => {
    console.log(count)
    gameCountdown.innerHTML = `${count}`
    count--
    if (count == 0) {
      clearInterval(interval)
      gameCountdown.innerHTML = '1'
    }
  }, 1000)
}

const baa = new Audio('./assets/sound/soundfx/baa.mp3')
const moo = new Audio('./assets/sound/soundfx/moo.mp3')
const woof = new Audio('./assets/sound/soundfx/woof.mp3')

const animalSounds = [baa, moo, woof]

function roundCountdown() {
  let count = roundLength
  const interval = setInterval(() => {
    gameCountdown.innerHTML = `${count}`
    count--
    if (Math.random() < 0.3) {
      console.log(0)
      let randomSound = animalSounds[Math.floor(Math.random() * animalSounds.length)]
      randomSound.volume = 1
      randomSound.play()
    }
    if (count == 0) {
      clearInterval(interval)
      gameCountdown.innerHTML = '0'
      activateClipboard()
      resetRound()
    }
  }, 1000)
}

function resetRound() {
  console.log(cowEaten, sheepEaten, wolfEaten)
  gameStart = false
  entities.length = 0
  bloodParticles.length = 0
  // generateEntities()
}

const clipboard = document.querySelector('#clipboardContainer')
const clipboardImage = document.querySelector('#clipboard')
const clipboardElements1 = document.querySelector('#clipboardElements1')
const clipboardElements2 = document.querySelector('#clipboardElements2')
const clipboardButton = document.querySelector('#clipboardButton')
const pageFlipSound = new Audio('./assets/sound/soundfx/pageflip.mp3')

function activateClipboard() {
  clipboard.style.display = 'block'
  clipboard.style.animation = 'slideUp1 2s ease-in forwards'
}

clipboardButton.addEventListener('click', () => {
  pageFlipSound.play()
  clipboardImage.src = './assets/images/UI/R2clipboard.png'
  clipboardElements1.style.display = 'none'
  clipboardElements2.style.display = 'block'
})

// Blood particle system
const bloodParticles = []

class BloodParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color || this.getRandomBloodColor()
    this.size = Math.random() * 5 + 2
    this.speedX = Math.random() * 6 - 3
    this.speedY = Math.random() * 6 - 3
    this.gravity = 0.01
    this.friction = 0.95
    this.life = 100
    this.decay = Math.random() * 0.6 + 0.4
  }

  getRandomBloodColor() {
    const shades = [
      '#8a0303', // Dark red
      '#b00202', // Medium red
      '#d10202', // Bright red
      '#5c0101', // Very dark red
    ]
    return shades[Math.floor(Math.random() * shades.length)]
  }

  update() {
    this.speedX *= this.friction
    this.speedY *= this.friction
    this.speedY += this.gravity
    this.x += this.speedX
    this.y += this.speedY
    this.life -= this.decay
  }

  draw() {
    ctx.save()
    ctx.globalAlpha = this.life / 100
    ctx.fillStyle = this.color
    ctx.beginPath()
    // Draw irregular blood splatter shapes
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// Game loop
async function gameLoop() {
  // playBackgroundMusic()

  CANVAS_SIZE[0] = window.innerWidth
  CANVAS_SIZE[1] = window.innerHeight - 340
  canvas.width = CANVAS_SIZE[0]
  canvas.height = CANVAS_SIZE[1]

  // loadAnimation()
  // ctx.clearRect(0, 0, canvas.width, canvas.height)
  adjustMovement()
  for (const particle of bloodParticles) {
    particle.update()
    particle.draw()
    if (particle.life <= 0) {
      bloodParticles.pop(particle)
    }
  }

  if (gameStart) {
    requestAnimationFrame(gameLoop)
  }
}

// Start the game
gameLoop()

import * as constants from './constants.js'
import Entity from './Models/Entity.js'

let first = 0

// Setup
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const layer1Background = document.querySelector('#layer1Background')
const layer2Background = document.querySelector('#layer2Background')
const select = new Audio('./assets/sound/soundfx/blipSelect.wav')
select.volume = 0.5
const explosion = new Audio('./assets/sound/soundfx/explosion.wav')
explosion.volume = 0.7
let CANVAS_SIZE = [window.innerWidth, window.innerHeight]
let gameStart = false
let lastFrameTime = 0

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

function adjustMovement(deltaTime) {
  ctx.clearRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1])

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
    } else if (entity.type === 'shark') {
      targets = entities.filter((e) => e.type === 'iceCream')
      threats = []
    } else if (entity.type === 'iceCream') {
      threats = entities.filter((e) => e.type === 'shark')
      targets = []
    } else {
      targets = entities.filter((e) => e.type === 'sheep')
      threats = entities.filter((e) => e.type === 'cow')
    }

    // Repel from same tribe
    for (const other of entities) {
      if (entity !== other && entity.type === other.type) {
        entity.repelFrom(CANVAS_SIZE, other, deltaTime)
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
            entity.distanceTo(current) < entity.distanceTo(closest) ? current : closest   )
        : null

    // Movement logic
    if (closestThreat && entity.distanceTo(closestThreat) < constants.DETECTION_RADIUS) {
      entity.moveAwayFrom(CANVAS_SIZE, closestThreat.x, closestThreat.y, deltaTime)
    } else if (closestTarget && entity.distanceTo(closestTarget) < constants.DETECTION_RADIUS) {
      entity.moveTowards(CANVAS_SIZE, closestTarget.x, closestTarget.y, deltaTime)
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
      entity.moveTowards(CANVAS_SIZE, Math.random() * CANVAS_SIZE[0], Math.random() * CANVAS_SIZE[1], deltaTime)
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

    const rotationAngle = Math.sin(entity.wobblePhase) * 0.2

    ctx.translate(entity.x, entity.y)
    if (!entity.facingRight) {
      ctx.scale(-1, 1)
    }
    ctx.rotate(rotationAngle)

    ctx.drawImage(
      img,
      entity.facingRight ? -constants.ICON_WIDTH / 2 : -constants.ICON_WIDTH / 2,
      -constants.ICON_HEIGHT / 2 + entity.wobbleOffset / 2,
      constants.ICON_WIDTH,
      constants.ICON_HEIGHT
    )

    ctx.restore()
  } else {
    ctx.fillStyle = entity.color
    ctx.beginPath()
    ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2)
    ctx.fill()
  }
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
// const settingsButton = document.querySelector('#settingsButton')
const cloudButton = document.querySelector('#cloudButton')
const tutorialScreen = document.querySelector('#tutorialScreen')

startButton.addEventListener('click', async () => {
  select.play()
  menuLogo.style.top = '13%'
  menuLogo.style.animation = 'fadeOut 2s forwards'
  startButton.style.animation = 'fadeOut 2s forwards'
  startButton.style.hover = 'none'
  setTimeout(function () {
    menuLogo.style.display = 'none'
  }, 2000)
  tutorialScreen.style.animation = 'dropAndBounce 2s ease-out forwards'
  tutorialScreen.style.display = 'block'
})

// settingsButton.addEventListener('click', () => {
//   console.log('Settings button clicked')
// })

cloudButton.addEventListener('click', () => {
  select.play()
  tutorialScreen.style.top = '13%'
  tutorialScreen.style.animation = 'fadeOut 2s forwards'
  beginGameCountdown()
  setTimeout(function () {
    gameStart = true
    requestAnimationFrame(gameLoop)
    tutorialScreen.style.display = 'none'
    roundCountdown()
  }, 3200)
})

const monster = document.querySelector('#monster')
const gameCountdown = document.querySelector('#gameCountdown')
const roundLength = 50
const countingDuration = 69000 // 45 seconds in ms
const startTime = Date.now()

// Make monster visible
monster.style.opacity = '0.75' // Semi-transparent

let monsterInterval
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

function stopMonster() {
  clearInterval(monsterInterval)
  document.getElementById('monster').style.opacity = '0'
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
    monsterInterval = setInterval(() => {
      // Calculate progress (0 to 1)
      const progress = (Date.now() - startTime) / countingDuration

      // Position from left edge (0% to 100% + width)
      if (progress <= 1) {
        monster.style.left = `${-500 + window.innerWidth * progress}px`
      } else {
        stopMonster()
      }
    }, 16) // ~60fps
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
      gameStart = false
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
const clipboardLeftButton = document.querySelector('#clipboardLeftButton')
const clipboardRightButton = document.querySelector('#clipboardRightButton')
const proceedButton = document.querySelector('#proceedButton')
const pageFlipSound = new Audio('./assets/sound/soundfx/pageflip.mp3')
const cowGuessProp = document.querySelector('#cowGuess')
const wolfGuessProp = document.querySelector('#wolfGuess')
const sheepGuessProp = document.querySelector('#sheepGuess')
let cowGuess, wolfGuess, sheepGuess

function activateClipboard() {
  clipboard.style.display = 'block'
  clipboard.style.animation = 'slideUp1 2s ease-in forwards'
  clipboardElements1.style.display = 'block'
  clipboardElements2.style.display = 'none'
  clipboardElements3.style.display = 'none'
}

clipboardButton.addEventListener('click', () => {
  pageFlipSound.play()
  clipboardImage.src = './assets/images/UI/EmptyClipboard.png'
  clipboardElements1.style.display = 'none'
  clipboardElements3.style.display = 'block'
  getUserGuess()
  setClipboard3data()
})

proceedButton.addEventListener('click', () => {
  pageFlipSound.play()
  clipboardImage.src = './assets/images/UI/R2clipboard.png'
  clipboardElements3.style.display = 'none'
  clipboardElements2.style.display = 'block'
})

clipboardLeftButton.addEventListener('click', () => {
  pageFlipSound.play()
  clipboardImage.src = './assets/images/UI/R1clipboard.png'
  clipboardElements3.style.display = 'none'
  clipboardElements1.style.display = 'block'
  clipboard.style.top = '50%'
  clipboard.style.animation = 'fadeOut 2s forwards'
  generateRound2()
})

clipboardRightButton.addEventListener('click', () => {
  pageFlipSound.play()
  clipboardImage.src = './assets/images/UI/R1clipboard.png'
  clipboardElements3.style.display = 'none'
  clipboardElements1.style.display = 'block'
  clipboard.style.top = '50%'
  clipboard.style.animation = 'fadeOut 2s forwards'
  generateRound2()
})

function getUserGuess() {
  cowGuess = cowGuessProp.value
  wolfGuess = wolfGuessProp.value
  sheepGuess = sheepGuessProp.value
  cowGuessProp.value = ''
  wolfGuessProp.value = ''
  sheepGuessProp.value = ''
}

function setClipboard3data() {
  const cowKilledLabel = document.querySelector('#cowKilled')
  const wolfKilledLabel = document.querySelector('#wolvesKilled')
  const sheepKilledLabel = document.querySelector('#sheepKilled')
  const cowKilledGuessLabel = document.querySelector('#cowKilledGuess')
  const wolfKilledGuessLabel = document.querySelector('#wolvesKilledGuess')
  const sheepKilledGuessLabel = document.querySelector('#sheepKilledGuess')

  cowKilledLabel.innerHTML = `Cows killed: ${cowEaten}`
  wolfKilledLabel.innerHTML = `Wolves killed: ${wolfEaten}`
  sheepKilledLabel.innerHTML = `Sheep killed: ${sheepEaten}`
  cowKilledGuessLabel.innerHTML = `Your Cow count: ${cowGuess}`
  wolfKilledGuessLabel.innerHTML = `Your Wolves count: ${wolfGuess}`
  sheepKilledGuessLabel.innerHTML = `Your Sheep count: ${sheepGuess}`
}

function generateRound2() {
  // Reset round
  resetRound()
  // Update entities
  let newAnimals = ['shark', 'iceCream']
  entities.length = 0
  for (let i = 0; i < 10; i++) {
    for (const animal of newAnimals) {
      entities.push(new Entity(Math.random() * CANVAS_SIZE[0], Math.random() * CANVAS_SIZE[1], animal))
    }
  }
  checkTouching()

  // Update game state
  requestAnimationFrame(gameLoop)
  beginGameCountdown()
  setTimeout(function () {
    gameStart = true
    requestAnimationFrame(gameLoop)
    tutorialScreen.style.display = 'none'
    roundCountdown()
  }, 3200)
}

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

  update(deltaTime) {
    this.speedX *= this.friction
    this.speedY *= this.friction
    this.speedY += this.gravity
    this.x += this.speedX * (deltaTime * constants.SPEED)
    this.y += this.speedY * (deltaTime * constants.SPEED)
    this.life -= this.decay * (deltaTime * constants.SPEED)
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
async function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastFrameTime) / 1000; 
  console.log(deltaTime)
  lastFrameTime = currentTime;
  playBackgroundMusic()

  CANVAS_SIZE[0] = window.innerWidth
  CANVAS_SIZE[1] = window.innerHeight - (window.innerHeight * 0.4)
  canvas.width = CANVAS_SIZE[0]
  canvas.height = CANVAS_SIZE[1]

  // loadAnimation()
  // ctx.clearRect(0, 0, canvas.width, canvas.height)
  adjustMovement(deltaTime)
  for (const particle of bloodParticles) {
    particle.update(deltaTime)
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
// gameLoop()
requestAnimationFrame(gameLoop);

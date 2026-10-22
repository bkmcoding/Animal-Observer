import * as constants from './constants.js'
import Entity, { getWorldMetrics, setWorldScale } from './Models/Entity.js'
import { parseGuess, scoreRound } from './scoring.js'
import {
  getDetectionRadius,
  getEcosystemForRound,
  getMonsterSweeps,
  getSpeedMultiplier,
  getSpeciesCount,
} from './progression.js'

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const menuLogo = document.querySelector('#menu')
const startButton = document.querySelector('#startGameButton')
const tutorialScreen = document.querySelector('#tutorialScreen')
const cloudButton = document.querySelector('#cloudButton')
const monster = document.querySelector('#monster')
const hud = document.querySelector('#hud')
const countdownDisplay = document.querySelector('#gameCountdown')
const roundLabel = document.querySelector('#roundLabel')
const ecosystemLabel = document.querySelector('#ecosystemLabel')
const scoreLabel = document.querySelector('#scoreLabel')
const clipboard = document.querySelector('#clipboardContainer')
const clipboardImage = document.querySelector('#clipboardImage')
const guessPage = document.querySelector('#guessPage')
const resultPage = document.querySelector('#resultPage')
const choicePage = document.querySelector('#choicePage')
const clipboardRoundNumber = document.querySelector('#clipboardRoundNumber')
const guessFields = document.querySelector('#guessFields')
const guessError = document.querySelector('#guessError')
const resultRows = document.querySelector('#resultRows')
const scoreSummary = document.querySelector('#scoreSummary')
const guessForm = document.querySelector('#guessPage')
const nextRoundButton = document.querySelector('#nextRoundButton')
const correlationButton = document.querySelector('#correlationButton')
const causationButton = document.querySelector('#causationButton')

const CLIPBOARD_ART = {
  guess: './assets/images/UI/R1clipboard.png',
  result: './assets/images/UI/EmptyClipboard.png',
  choice: './assets/images/UI/R2clipboard.png',
}

const selectSound = new Audio('./assets/sound/soundfx/blipSelect.wav')
const explosionSound = new Audio('./assets/sound/soundfx/explosion.wav')
const pageFlipSound = new Audio('./assets/sound/soundfx/pageFlip.mp3')
const backgroundMusic = new Audio('./assets/sound/music/feedthemachine.mp3')

const imageCache = {}
const entities = []
let bloodParticles = []
let backgroundMusicStarted = false

const state = {
  round: 1,
  phase: 'menu',
  ecosystem: constants.ECOSYSTEMS.field,
  counts: {},
  guesses: {},
  roundScore: 0,
  totalScore: 0,
  speedMultiplier: 1,
  detectionRadiusBase: constants.BASE_DETECTION_RADIUS,
  detectionRadius: constants.BASE_DETECTION_RADIUS,
  monsterSweeps: 1,
  roundStartTime: 0,
  lastFrameTime: 0,
  animationFrame: null,
  countdownTimer: null,
  roundTimer: null,
  roundTimeout: null,
}

let CANVAS_SIZE = [window.innerWidth, window.innerHeight]

function refreshScaledDetectionRadius() {
  state.detectionRadius = state.detectionRadiusBase * getWorldMetrics().scale
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (imageCache[url]) {
      resolve(imageCache[url])
      return
    }

    const image = new Image()
    image.onload = () => {
      imageCache[url] = image
      resolve(image)
    }
    image.onerror = reject
    image.src = url
  })
}

async function preloadImages() {
  const images = Object.values(constants.SPECIES).map((species) => species.image)

  try {
    await Promise.all(images.map(loadImage))
  } catch (error) {
    console.error('Unable to load all animal images:', error)
  }
}

function playSound(audio, volume = 1) {
  const sound = audio.cloneNode()
  sound.volume = volume
  sound.play().catch((error) => console.error('Audio playback failed:', error))
}

function startBackgroundMusic() {
  if (backgroundMusicStarted) {
    return
  }

  backgroundMusicStarted = true
  backgroundMusic.loop = true
  backgroundMusic.volume = 0.1
  backgroundMusic.play().catch((error) => console.error('Background music failed:', error))
}

function resizeCanvas() {
  const canvasBounds = canvas.getBoundingClientRect()
  const nextWidth = Math.max(1, canvasBounds.width)
  const nextHeight = Math.max(1, canvasBounds.height)
  const previousWidth = CANVAS_SIZE[0]
  const previousHeight = CANVAS_SIZE[1]
  const shouldRemap =
    entities.length > 0 && previousWidth > 1 && previousHeight > 1 && (previousWidth !== nextWidth || previousHeight !== nextHeight)

  if (shouldRemap) {
    const scaleX = nextWidth / previousWidth
    const scaleY = nextHeight / previousHeight

    for (const entity of entities) {
      entity.x *= scaleX
      entity.y *= scaleY
      entity.lastStableX *= scaleX
    }

    for (const particle of bloodParticles) {
      particle.x *= scaleX
      particle.y *= scaleY
    }
  }

  CANVAS_SIZE[0] = nextWidth
  CANVAS_SIZE[1] = nextHeight

  const rawScale = Math.min(nextWidth / constants.WINDOW_WIDTH, nextHeight / constants.WINDOW_HEIGHT)
  setWorldScale(rawScale)
  refreshScaledDetectionRadius()

  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1)
  canvas.width = Math.round(CANVAS_SIZE[0] * devicePixelRatio)
  canvas.height = Math.round(CANVAS_SIZE[1] * devicePixelRatio)
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

  for (const entity of entities) {
    entity.size = getWorldMetrics().iconWidth
    entity.clampToBounds(CANVAS_SIZE)
  }
}

function randomPositionWithinBounds() {
  const margin = getWorldMetrics().edgeAvoidRadius
  const maxX = Math.max(margin, CANVAS_SIZE[0] - margin)
  const maxY = Math.max(margin, CANVAS_SIZE[1] - margin)

  return {
    x: margin + Math.random() * Math.max(0, maxX - margin),
    y: margin + Math.random() * Math.max(0, maxY - margin),
  }
}

function checkTouching() {
  const spacing = constants.ICON_WIDTH

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entityA = entities[i]
      const entityB = entities[j]

      if (entityA.distanceTo(entityB) < spacing) {
        const position = randomPositionWithinBounds()
        entityB.x = position.x
        entityB.y = position.y
        entityB.clampToBounds(CANVAS_SIZE)
      }
    }
  }
}

function spawnEntities() {
  entities.length = 0
  const countPerSpecies = getSpeciesCount(state.ecosystem, state.round)

  for (const type of state.ecosystem.species) {
    for (let i = 0; i < countPerSpecies; i++) {
      const position = randomPositionWithinBounds()
      entities.push(new Entity(position.x, position.y, type, state.speedMultiplier))
    }
  }

  checkTouching()
}

function clearTimers() {
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer)
    state.countdownTimer = null
  }

  if (state.roundTimer) {
    clearInterval(state.roundTimer)
    state.roundTimer = null
  }

  if (state.roundTimeout) {
    clearTimeout(state.roundTimeout)
    state.roundTimeout = null
  }
}

function stopGameLoop() {
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame)
    state.animationFrame = null
  }
}

function updateHud() {
  roundLabel.textContent = `Round ${state.round}`
  ecosystemLabel.textContent = state.ecosystem.label
  scoreLabel.textContent = `Score ${state.totalScore}`
}

function showHud() {
  hud.hidden = false
  updateHud()
}

function hideHud() {
  hud.hidden = true
  countdownDisplay.textContent = ''
}

function hideClipboardPages() {
  guessPage.hidden = true
  resultPage.hidden = true
  choicePage.hidden = true
}

function resetClipboardRadios() {
  for (const radio of guessForm.querySelectorAll('.clipboard-radio')) {
    radio.checked = false
  }
}

function startRound(round) {
  clearTimers()
  stopGameLoop()

  state.round = round
  state.ecosystem = getEcosystemForRound(round)
  state.speedMultiplier = getSpeedMultiplier(round)
  state.detectionRadiusBase = getDetectionRadius(round)
  state.monsterSweeps = getMonsterSweeps(round)
  state.counts = Object.fromEntries(state.ecosystem.species.map((type) => [type, 0]))
  state.guesses = {}
  state.roundScore = 0
  state.phase = 'countdown'
  state.lastFrameTime = 0
  state.roundStartTime = 0
  bloodParticles = []

  clipboard.hidden = true
  hideClipboardPages()
  monster.style.visibility = 'visible'
  showHud()
  resizeCanvas()
  spawnEntities()
  startCountdown()
}

function startCountdown() {
  let count = 3
  countdownDisplay.textContent = `${count}`

  state.countdownTimer = setInterval(() => {
    count -= 1

    if (count > 0) {
      countdownDisplay.textContent = `${count}`
      return
    }

    clearInterval(state.countdownTimer)
    state.countdownTimer = null
    beginObservation()
  }, constants.PRE_ROUND_COUNTDOWN_MS / 3)
}

function beginObservation() {
  state.phase = 'observing'
  state.roundStartTime = performance.now()
  state.lastFrameTime = performance.now()
  startBackgroundMusic()
  startRoundTimer()
  state.animationFrame = requestAnimationFrame(gameLoop)
}

function startRoundTimer() {
  const updateCountdown = () => {
    const remainingMs = Math.max(0, state.roundStartTime + constants.ROUND_DURATION_MS - performance.now())
    countdownDisplay.textContent = `${Math.ceil(remainingMs / 1000)}`
  }

  updateCountdown()
  state.roundTimer = setInterval(updateCountdown, 250)
  state.roundTimeout = setTimeout(endObservation, constants.ROUND_DURATION_MS)
}

function endObservation() {
  if (state.phase !== 'observing') {
    return
  }

  state.phase = 'report'
  clearTimers()
  stopGameLoop()
  hideHud()
  monster.style.visibility = 'hidden'
  renderGuessForm()
  playSound(pageFlipSound, 0.6)
}

function showClipboard(mode) {
  clipboard.hidden = false
  clipboardImage.src = CLIPBOARD_ART[mode]
}

function createGuessInput(type, slotIndex) {
  const input = document.createElement('input')
  input.id = `guess-${type}`
  input.className = `guess-input guess-slot-${slotIndex}`
  input.type = 'number'
  input.min = '0'
  input.step = '1'
  input.inputMode = 'numeric'
  input.required = true
  input.autocomplete = 'off'
  input.setAttribute('aria-label', `${constants.SPECIES[type].name} count`)
  return input
}

function renderGuessForm() {
  clipboardRoundNumber.textContent = `${state.round}`
  guessFields.replaceChildren()
  guessError.textContent = ''
  resetClipboardRadios()

  state.ecosystem.species.forEach((type, slotIndex) => {
    guessFields.append(createGuessInput(type, slotIndex))
  })

  hideClipboardPages()
  guessPage.hidden = false
  showClipboard('guess')

  const firstInput = guessFields.querySelector('.guess-input')
  if (firstInput) {
    firstInput.focus()
  }
}

function submitGuesses(event) {
  event.preventDefault()
  const inputs = [...guessFields.querySelectorAll('.guess-input')]
  const guesses = {}
  let firstInvalidInput = null

  for (const input of inputs) {
    const type = input.id.replace('guess-', '')
    const parsedGuess = parseGuess(input.value)

    if (parsedGuess === null) {
      input.classList.add('invalid')
      if (!firstInvalidInput) {
        firstInvalidInput = input
      }
    } else {
      input.classList.remove('invalid')
      guesses[type] = parsedGuess
    }
  }

  if (firstInvalidInput) {
    guessError.textContent = 'Enter a whole number of 0 or greater for every animal.'
    firstInvalidInput.focus()
    return
  }

  guessError.textContent = ''
  state.guesses = guesses

  const result = scoreRound(state.counts, guesses, state.ecosystem.species)
  state.roundScore = result.roundScore
  state.totalScore += result.roundScore
  updateHud()
  renderResults(result)
  playSound(pageFlipSound, 0.6)
}

function createResultLine(text) {
  const line = document.createElement('div')
  line.className = 'result-row'
  line.textContent = text
  return line
}

function renderResults(result) {
  resultRows.replaceChildren()

  for (const row of result.rows) {
    resultRows.append(createResultLine(`${constants.SPECIES[row.type].name} killed: ${row.actual}`))
  }

  for (const row of result.rows) {
    resultRows.append(createResultLine(`Your ${constants.SPECIES[row.type].name} count: ${row.guess}`))
  }

  const bonusText = result.bonus ? `Perfect bonus +${result.bonus}` : 'No perfect bonus'
  scoreSummary.textContent = `Round score ${result.roundScore} · ${bonusText} · Session ${state.totalScore}`

  hideClipboardPages()
  resultPage.hidden = false
  showClipboard('result')
}

function renderChoicePage() {
  hideClipboardPages()
  choicePage.hidden = false
  showClipboard('choice')
}

function advanceFromChoice() {
  playSound(pageFlipSound, 0.6)
  startRound(state.round + 1)
}

function getClosestEntity(entity, candidates) {
  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((closest, current) =>
    entity.distanceTo(current) < entity.distanceTo(closest) ? current : closest
  )
}

function respawnEntity(entity) {
  const position = randomPositionWithinBounds()
  entity.x = position.x
  entity.y = position.y
  entity.lastStableX = entity.x
}

function registerCapture(target) {
  state.counts[target.type] += 1
  playSound(explosionSound, 0.7)

  for (let i = 0; i < 30; i++) {
    bloodParticles.push(new BloodParticle(target.x, target.y))
  }

  respawnEntity(target)
}

function updateEntities(deltaTime) {
  const entitiesByType = Object.fromEntries(
    state.ecosystem.species.map((type) => [
      type,
      entities.filter((entity) => entity.type === type),
    ])
  )

  for (const entity of entities) {
    const preyType = constants.PREY_BY_PREDATOR[entity.type]
    const predatorType = constants.PREDATOR_BY_PREY[entity.type]
    const targets = preyType ? entitiesByType[preyType] : []
    const threats = predatorType ? entitiesByType[predatorType] : []

    for (const other of entities) {
      if (entity !== other && entity.type === other.type) {
        entity.repelFrom(CANVAS_SIZE, other, deltaTime)
      }
    }

    const closestTarget = getClosestEntity(entity, targets)
    const closestThreat = getClosestEntity(entity, threats)

    if (closestThreat && entity.distanceTo(closestThreat) < state.detectionRadius) {
      entity.moveAwayFrom(CANVAS_SIZE, closestThreat.x, closestThreat.y, deltaTime)
    } else if (closestTarget && entity.distanceTo(closestTarget) < state.detectionRadius) {
      entity.moveTowards(CANVAS_SIZE, closestTarget.x, closestTarget.y, deltaTime)

      if (entity.distanceTo(closestTarget) < getWorldMetrics().conversionRadius) {
        registerCapture(closestTarget)
      }
    } else {
      const target = randomPositionWithinBounds()
      entity.moveTowards(CANVAS_SIZE, target.x, target.y, deltaTime)
    }

    drawEntity(entity)
  }
}

function drawEntity(entity) {
  entity.updateWobble()
  entity.updateDirection()

  const metrics = getWorldMetrics()
  const image = imageCache[constants.SPECIES[entity.type].image]

  if (!image) {
    ctx.fillStyle = '#5c4033'
    ctx.beginPath()
    ctx.arc(entity.x, entity.y, constants.ENTITY_RADIUS * 3, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  const rotation = Math.sin(entity.wobblePhase) * 0.2
  ctx.save()
  ctx.translate(entity.x, entity.y + entity.wobbleOffset / 2)
  if (!entity.facingRight) {
    ctx.scale(-1, 1)
  }
  ctx.rotate(rotation)
  ctx.drawImage(image, -metrics.iconWidth / 2, -metrics.iconHeight / 2, metrics.iconWidth, metrics.iconHeight)
  ctx.restore()
}

function updateParticles(deltaTime) {
  for (const particle of bloodParticles) {
    particle.update(deltaTime)
    particle.draw()
  }

  bloodParticles = bloodParticles.filter((particle) => particle.life > 0)
}

class BloodParticle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.color = this.getRandomBloodColor()
    this.size = Math.random() * 5 + 2
    this.speedX = Math.random() * 6 - 3
    this.speedY = Math.random() * 6 - 3
    this.gravity = 0.01
    this.friction = 0.95
    this.life = 100
    this.decay = Math.random() * 0.6 + 0.4
  }

  getRandomBloodColor() {
    const shades = ['#8a0303', '#b00202', '#d10202', '#5c0101']
    return shades[Math.floor(Math.random() * shades.length)]
  }

  update(deltaTime) {
    this.speedX *= this.friction
    this.speedY *= this.friction
    this.speedY += this.gravity
    this.x += this.speedX * deltaTime * constants.SPEED
    this.y += this.speedY * deltaTime * constants.SPEED
    this.life -= this.decay * deltaTime * constants.SPEED
  }

  draw() {
    ctx.save()
    ctx.globalAlpha = Math.max(0, this.life / 100)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function updateMonster(elapsed) {
  const roundProgress = Math.min(1, elapsed / constants.ROUND_DURATION_MS)
  const sweepProgress = roundProgress >= 1 ? 1 : (roundProgress * state.monsterSweeps) % 1
  const monsterWidth = monster.offsetWidth
  const travelDistance = window.innerWidth + monsterWidth
  monster.style.left = `${-monsterWidth + travelDistance * sweepProgress}px`
}

function gameLoop(currentTime) {
  if (state.phase !== 'observing') {
    return
  }

  const rawDeltaTime = (currentTime - state.lastFrameTime) / 1000
  const deltaTime = Math.min(0.05, Math.max(0, rawDeltaTime))
  state.lastFrameTime = currentTime

  ctx.clearRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1])
  updateEntities(deltaTime)
  updateParticles(deltaTime)
  updateMonster(performance.now() - state.roundStartTime)

  state.animationFrame = requestAnimationFrame(gameLoop)
}

startButton.addEventListener('click', () => {
  playSound(selectSound, 0.5)
  startButton.disabled = true
  menuLogo.style.animation = 'fadeOut 1s forwards'
  startButton.style.animation = 'fadeOut 1s forwards'

  setTimeout(() => {
    menuLogo.style.display = 'none'
    startButton.style.display = 'none'
    tutorialScreen.hidden = false
    tutorialScreen.style.animation = 'dropIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards'
  }, 1000)
})

cloudButton.addEventListener('click', () => {
  playSound(selectSound, 0.5)
  tutorialScreen.hidden = true
  startRound(1)
})

guessForm.addEventListener('submit', submitGuesses)
nextRoundButton.addEventListener('click', () => {
  playSound(selectSound, 0.5)
  playSound(pageFlipSound, 0.6)
  renderChoicePage()
})
correlationButton.addEventListener('click', advanceFromChoice)
causationButton.addEventListener('click', advanceFromChoice)

window.addEventListener('resize', resizeCanvas)

if (typeof ResizeObserver === 'function') {
  const canvasResizeObserver = new ResizeObserver(() => {
    resizeCanvas()
  })
  canvasResizeObserver.observe(canvas)
}

await preloadImages()
resizeCanvas()

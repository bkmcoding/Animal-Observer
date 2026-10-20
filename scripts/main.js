import * as constants from './constants.js'
import Entity from './Models/Entity.js'
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
const countdownDisplay = document.querySelector('#gameCountdown')
const roundLabel = document.querySelector('#roundLabel')
const ecosystemLabel = document.querySelector('#ecosystemLabel')
const scoreLabel = document.querySelector('#scoreLabel')
const clipboard = document.querySelector('#clipboardContainer')
const guessPage = document.querySelector('#guessPage')
const resultPage = document.querySelector('#resultPage')
const clipboardTitle = document.querySelector('#clipboardTitle')
const clipboardSubtitle = document.querySelector('#clipboardSubtitle')
const guessFields = document.querySelector('#guessFields')
const guessError = document.querySelector('#guessError')
const resultSummary = document.querySelector('#resultSummary')
const resultRows = document.querySelector('#resultRows')
const scoreSummary = document.querySelector('#scoreSummary')
const guessForm = document.querySelector('#guessPage')
const nextRoundButton = document.querySelector('#nextRoundButton')

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
  CANVAS_SIZE[0] = window.innerWidth
  CANVAS_SIZE[1] = Math.max(240, window.innerHeight - Math.round(window.innerHeight * 0.4))
  canvas.width = CANVAS_SIZE[0]
  canvas.height = CANVAS_SIZE[1]

  for (const entity of entities) {
    entity.clampToBounds(CANVAS_SIZE)
  }
}

function randomPositionWithinBounds() {
  const margin = constants.EDGE_AVOID_RADIUS
  return {
    x: margin + Math.random() * Math.max(0, CANVAS_SIZE[0] - margin * 2),
    y: margin + Math.random() * Math.max(0, CANVAS_SIZE[1] - margin * 2),
  }
}

function checkTouching() {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entityA = entities[i]
      const entityB = entities[j]

      if (entityA.distanceTo(entityB) < constants.ICON_WIDTH) {
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

function startRound(round) {
  clearTimers()
  stopGameLoop()

  state.round = round
  state.ecosystem = getEcosystemForRound(round)
  state.speedMultiplier = getSpeedMultiplier(round)
  state.detectionRadius = getDetectionRadius(round)
  state.monsterSweeps = getMonsterSweeps(round)
  state.counts = Object.fromEntries(state.ecosystem.species.map((type) => [type, 0]))
  state.guesses = {}
  state.roundScore = 0
  state.phase = 'countdown'
  state.lastFrameTime = 0
  state.roundStartTime = 0
  bloodParticles = []

  clipboard.hidden = true
  guessPage.hidden = true
  resultPage.hidden = true
  monster.style.opacity = '0.75'
  updateHud()
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
  countdownDisplay.textContent = '0'
  monster.style.opacity = '0'
  renderGuessForm()
  playSound(pageFlipSound, 0.6)
}

function showClipboard(mode) {
  clipboard.hidden = false
  clipboard.classList.toggle('guess-mode', mode === 'guess')
  clipboard.classList.toggle('result-mode', mode === 'result')
}

function createGuessRow(type) {
  const row = document.createElement('div')
  row.className = 'guess-row'

  const label = document.createElement('label')
  label.setAttribute('for', `guess-${type}`)
  label.textContent = constants.SPECIES[type].name

  const input = document.createElement('input')
  input.id = `guess-${type}`
  input.className = 'guess-input'
  input.type = 'number'
  input.min = '0'
  input.step = '1'
  input.inputMode = 'numeric'
  input.required = true
  input.autocomplete = 'off'

  row.append(label, input)
  return row
}

function renderGuessForm() {
  clipboardTitle.textContent = 'Observation report'
  clipboardSubtitle.textContent = `Round ${state.round} — ${state.ecosystem.label}`
  guessFields.replaceChildren()
  guessError.textContent = ''

  for (const type of state.ecosystem.species) {
    guessFields.append(createGuessRow(type))
  }

  guessPage.hidden = false
  resultPage.hidden = true
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

function createResultRow(row) {
  const resultRow = document.createElement('div')
  resultRow.className = 'result-row'

  const name = document.createElement('strong')
  name.textContent = constants.SPECIES[row.type].name

  const actual = document.createElement('span')
  actual.textContent = `Actual ${row.actual}`

  const guess = document.createElement('span')
  guess.textContent = `Guess ${row.guess}`

  const error = document.createElement('span')
  error.textContent = `Error ${row.error}`

  const points = document.createElement('span')
  points.className = 'result-points'
  points.textContent = `${row.points} pts`

  resultRow.append(name, actual, guess, error, points)
  return resultRow
}

function renderResults(result) {
  resultSummary.textContent = `Round ${state.round} — ${state.ecosystem.label}`
  resultRows.replaceChildren()

  for (const row of result.rows) {
    resultRows.append(createResultRow(row))
  }

  const bonusText = result.bonus ? `Perfect bonus +${result.bonus}` : 'No perfect bonus'
  scoreSummary.textContent = `Round score ${result.roundScore} · ${bonusText} · Session score ${state.totalScore}`

  guessPage.hidden = true
  resultPage.hidden = false
  showClipboard('result')
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

      if (entity.distanceTo(closestTarget) < constants.CONVERSION_RADIUS) {
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
  ctx.drawImage(image, -constants.ICON_WIDTH / 2, -constants.ICON_HEIGHT / 2, constants.ICON_WIDTH, constants.ICON_HEIGHT)
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
  monster.style.left = `${-500 + window.innerWidth * sweepProgress}px`
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
    tutorialScreen.style.animation = 'dropAndBounce 1s ease-out forwards'
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
  startRound(state.round + 1)
})

window.addEventListener('resize', resizeCanvas)

await preloadImages()
resizeCanvas()
updateHud()

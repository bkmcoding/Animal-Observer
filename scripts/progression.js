import * as constants from './constants.js'

export function getEcosystemForRound(round) {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('Round numbers must be positive integers.')
  }

  return round % 2 === 1 ? constants.ECOSYSTEMS.field : constants.ECOSYSTEMS.sea
}

export function getSpeciesCount(ecosystem, round) {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('Round numbers must be positive integers.')
  }

  const completedTwoRoundCycles = Math.floor((round - 1) / 2)
  return Math.min(ecosystem.maxCount, ecosystem.baseCount + completedTwoRoundCycles * ecosystem.countIncrement)
}

export function getSpeedMultiplier(round) {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('Round numbers must be positive integers.')
  }

  return Math.min(constants.MAX_SPEED_MULTIPLIER, 1 + (round - 1) * constants.SPEED_MULTIPLIER_STEP)
}

export function getDetectionRadius(round) {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('Round numbers must be positive integers.')
  }

  return Math.min(
    constants.MAX_DETECTION_RADIUS,
    constants.BASE_DETECTION_RADIUS + (round - 1) * constants.DETECTION_RADIUS_STEP
  )
}

export function getMonsterSweeps(round) {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('Round numbers must be positive integers.')
  }

  return Math.min(constants.MAX_MONSTER_SWEEPS, 1 + Math.floor((round - 1) / 2))
}

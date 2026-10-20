export const CATEGORY_BASE_POINTS = 300
export const PERFECT_ROUND_BONUS = 50
export const MINIMUM_ERROR_PENALTY = 5

export function parseGuess(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  const parsedValue = Number(trimmedValue)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null
  }

  return parsedValue
}

export function scoreRound(actualCounts, guesses, species) {
  if (!Array.isArray(species) || species.length === 0) {
    throw new Error('A round must contain at least one species.')
  }

  const categoryMax = Math.floor(CATEGORY_BASE_POINTS / species.length)
  const penaltyPerError = Math.max(MINIMUM_ERROR_PENALTY, Math.floor(categoryMax / 10))
  const rows = []
  let roundScore = 0
  let isPerfectRound = true

  for (const type of species) {
    const actual = actualCounts[type]
    const guess = guesses[type]

    if (!Number.isInteger(actual) || actual < 0) {
      throw new Error(`Missing valid actual count for ${type}.`)
    }

    if (!Number.isInteger(guess) || guess < 0) {
      throw new Error(`Missing valid guess for ${type}.`)
    }

    const error = Math.abs(actual - guess)
    const points = Math.max(0, categoryMax - penaltyPerError * error)

    if (error !== 0) {
      isPerfectRound = false
    }

    roundScore += points
    rows.push({
      type,
      actual,
      guess,
      error,
      points,
      categoryMax,
      penaltyPerError,
    })
  }

  const bonus = isPerfectRound ? PERFECT_ROUND_BONUS : 0

  return {
    rows,
    roundScore: roundScore + bonus,
    baseScore: roundScore,
    bonus,
    isPerfectRound,
    categoryMax,
    penaltyPerError,
  }
}

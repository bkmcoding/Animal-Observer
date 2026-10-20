import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CATEGORY_BASE_POINTS,
  MINIMUM_ERROR_PENALTY,
  parseGuess,
  scoreRound,
} from '../scripts/scoring.js'

test('parses valid whole-number guesses', () => {
  assert.equal(parseGuess('0'), 0)
  assert.equal(parseGuess(' 12 '), 12)
})

test('rejects invalid guesses', () => {
  assert.equal(parseGuess(''), null)
  assert.equal(parseGuess('  '), null)
  assert.equal(parseGuess('-1'), null)
  assert.equal(parseGuess('2.5'), null)
  assert.equal(parseGuess('two'), null)
})

test('awards a perfect field round with the bonus', () => {
  const actual = { cow: 2, wolf: 1, sheep: 3 }
  const guesses = { cow: 2, wolf: 1, sheep: 3 }
  const result = scoreRound(actual, guesses, ['cow', 'wolf', 'sheep'])

  assert.equal(result.categoryMax, 100)
  assert.equal(result.penaltyPerError, 10)
  assert.equal(result.baseScore, 300)
  assert.equal(result.bonus, 50)
  assert.equal(result.roundScore, 350)
  assert.equal(result.isPerfectRound, true)
})

test('gives partial credit for close field guesses', () => {
  const actual = { cow: 2, wolf: 1, sheep: 3 }
  const guesses = { cow: 4, wolf: 1, sheep: 3 }
  const result = scoreRound(actual, guesses, ['cow', 'wolf', 'sheep'])

  assert.equal(result.rows[0].points, 80)
  assert.equal(result.rows[1].points, 100)
  assert.equal(result.rows[2].points, 100)
  assert.equal(result.baseScore, 280)
  assert.equal(result.bonus, 0)
  assert.equal(result.roundScore, 280)
})

test('normalizes sea rounds to the same base maximum', () => {
  const actual = { shark: 5, iceCream: 4 }
  const guesses = { shark: 6, iceCream: 4 }
  const result = scoreRound(actual, guesses, ['shark', 'iceCream'])

  assert.equal(result.categoryMax, 150)
  assert.equal(result.penaltyPerError, 15)
  assert.equal(result.rows[0].points, 135)
  assert.equal(result.rows[1].points, 150)
  assert.equal(result.roundScore, 285)
})

test('uses the documented point constants', () => {
  assert.equal(CATEGORY_BASE_POINTS, 300)
  assert.equal(MINIMUM_ERROR_PENALTY, 5)
})

test('rejects incomplete or invalid score input', () => {
  assert.throws(() => scoreRound({}, {}, []), /at least one species/)
  assert.throws(() => scoreRound({ cow: 1 }, { cow: 1 }, ['cow', 'wolf']), /wolf/)
  assert.throws(() => scoreRound({ cow: 1 }, { cow: -1 }, ['cow']), /guess/)
})

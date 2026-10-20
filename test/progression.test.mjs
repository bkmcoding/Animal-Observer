import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getDetectionRadius,
  getEcosystemForRound,
  getMonsterSweeps,
  getSpeedMultiplier,
  getSpeciesCount,
} from '../scripts/progression.js'
import { ECOSYSTEMS } from '../scripts/constants.js'

test('alternates field and sea ecosystems by round parity', () => {
  assert.equal(getEcosystemForRound(1), ECOSYSTEMS.field)
  assert.equal(getEcosystemForRound(2), ECOSYSTEMS.sea)
  assert.equal(getEcosystemForRound(3), ECOSYSTEMS.field)
  assert.equal(getEcosystemForRound(4), ECOSYSTEMS.sea)
})

test('increases species counts until their caps', () => {
  assert.equal(getSpeciesCount(ECOSYSTEMS.field, 1), 5)
  assert.equal(getSpeciesCount(ECOSYSTEMS.field, 3), 6)
  assert.equal(getSpeciesCount(ECOSYSTEMS.field, 11), 10)
  assert.equal(getSpeciesCount(ECOSYSTEMS.field, 13), 10)

  assert.equal(getSpeciesCount(ECOSYSTEMS.sea, 2), 10)
  assert.equal(getSpeciesCount(ECOSYSTEMS.sea, 4), 12)
  assert.equal(getSpeciesCount(ECOSYSTEMS.sea, 12), 20)
  assert.equal(getSpeciesCount(ECOSYSTEMS.sea, 14), 20)
})

test('caps speed and detection growth', () => {
  assert.equal(getSpeedMultiplier(1), 1)
  assert.equal(getSpeedMultiplier(13), 1.96)
  assert.equal(getSpeedMultiplier(14), 2)
  assert.equal(getSpeedMultiplier(20), 2)

  assert.equal(getDetectionRadius(1), 150)
  assert.equal(getDetectionRadius(12), 238)
  assert.equal(getDetectionRadius(13), 240)
})

test('caps monster sweeps at three', () => {
  assert.equal(getMonsterSweeps(1), 1)
  assert.equal(getMonsterSweeps(3), 2)
  assert.equal(getMonsterSweeps(5), 3)
  assert.equal(getMonsterSweeps(9), 3)
})

test('rejects invalid round numbers', () => {
  assert.throws(() => getEcosystemForRound(0), /positive integers/)
  assert.throws(() => getSpeciesCount(ECOSYSTEMS.field, 1.5), /positive integers/)
  assert.throws(() => getSpeedMultiplier('2'), /positive integers/)
})

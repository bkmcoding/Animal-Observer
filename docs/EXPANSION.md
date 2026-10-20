# Expansion Guide

This guide lists the safest places to extend **Animal Observer** without redesigning the core loop.

## New characters

### Add a species

1. Add the species to `scripts/constants.js` under `SPECIES`.
2. Add its predator/prey relationship to:
   - `PREY_BY_PREDATOR`
   - `PREDATOR_BY_PREY`
3. Add the species to one or more `ECOSYSTEMS` arrays.
4. Add a matching image path in `SPECIES`.

No gameplay code should need to change if the new species follows the current chase/flee model.

### Add a new ecosystem

1. Add a new ecosystem object to `ECOSYSTEMS`.
2. Add its ID to `ECOSYSTEM_CYCLE`.
3. Optionally adjust `baseCount`, `countIncrement`, and `maxCount`.

The round cycle automatically supports more than two ecosystems.

## New features

### Observer tools

Good candidates:

- Pause or slow-motion tokens.
- A zoom or focus mode.
- A notebook that records partial counts.
- A tag tool that highlights one animal type.

Implementation hooks:

- Add tool state to `state` in `scripts/main.js`.
- Add tool buttons near `#hud`.
- Apply effects in `updateEntities`.

### Upgrades

Good candidates:

- Extra observation time.
- Wider detection radius.
- Fewer monster sweeps.
- Score multipliers.

Implementation hooks:

- Store upgrade state in `state`.
- Apply modifiers in `scripts/progression.js`.
- Show upgrade effects in `renderResults`.

### Challenges

Good candidates:

- Daily or weekly target counts.
- Streak bonuses.
- Special one-off ecosystems.

Implementation hooks:

- Add a `challenge` object to `state`.
- Apply its rules in `startRound`.
- Show challenge progress in `renderResults`.

## Artistic expansion

Safe places to expand without changing gameplay:

- Add seasonal background variants.
- Add new clipboard skins.
- Add species-specific capture particles.
- Add ambient sound layers.
- Add celebration effects for perfect rounds.

Art should be added as new assets and referenced from CSS or `SPECIES`; the gameplay code should not need to know about the art style.

## Mobile and scaling notes

- Canvas scaling is driven by its CSS box and `getBoundingClientRect`.
- Background layers use percentage sizing.
- The clipboard uses viewport-aware width and height limits.
- Entity positions are clamped on resize.
- The monster uses its own width for responsive sweep positioning.
- The game shell is fixed to the viewport and intentionally clips the animated background layers.

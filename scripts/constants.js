export const WINDOW_WIDTH = 1920
export const WINDOW_HEIGHT = 1080
export const ENTITY_RADIUS = 5
export const SPEED = 100
export const BASE_DETECTION_RADIUS = 150
export const MAX_DETECTION_RADIUS = 240
export const DETECTION_RADIUS_STEP = 8
export const CONVERSION_RADIUS = 50
export const EDGE_AVOID_RADIUS = 60
export const REPULSION_RADIUS = 90
export const ICON_WIDTH = 65
export const ICON_HEIGHT = 45
export const WOBBLE_SPEED = 0.07
export const WOBBLE_AMOUNT = 3
export const FLIP_THRESHOLD = 10

export const PRE_ROUND_COUNTDOWN_MS = 3000
export const ROUND_DURATION_MS = 50000
export const MAX_SPEED_MULTIPLIER = 2
export const SPEED_MULTIPLIER_STEP = 0.08
export const MAX_MONSTER_SWEEPS = 3

export const SPECIES = {
  cow: {
    name: 'Cow',
    image: '../assets/images/animals/cow.png',
  },
  sheep: {
    name: 'Sheep',
    image: '../assets/images/animals/sheep.png',
  },
  wolf: {
    name: 'Wolf',
    image: '../assets/images/animals/wolf.png',
  },
  shark: {
    name: 'Shark',
    image: '../assets/images/animals/shark.png',
  },
  iceCream: {
    name: 'Ice cream',
    image: '../assets/images/animals/iceCream.png',
  },
}

export const PREY_BY_PREDATOR = {
  cow: 'wolf',
  sheep: 'cow',
  wolf: 'sheep',
  shark: 'iceCream',
}

export const PREDATOR_BY_PREY = {
  wolf: 'cow',
  cow: 'sheep',
  sheep: 'wolf',
  iceCream: 'shark',
}

export const ECOSYSTEMS = {
  field: {
    id: 'field',
    label: 'Field',
    species: ['cow', 'wolf', 'sheep'],
    baseCount: 5,
    countIncrement: 1,
    maxCount: 10,
  },
  sea: {
    id: 'sea',
    label: 'Sea',
    species: ['shark', 'iceCream'],
    baseCount: 10,
    countIncrement: 2,
    maxCount: 20,
  },
}

export const ECOSYSTEM_CYCLE = ['field', 'sea']

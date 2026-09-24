import { pointsForDrink } from './drinks'

// Modifiers are toggleable and stack (multi-select). No selection = standard rules.
export const MODIFIERS = [
  {
    id: 'no-shots',
    name: 'No Shots',
    description: 'Every drink instruction is capped at a single standard drink.',
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Family-friendly — points only, no drinks. Losers do a silly forfeit.',
  },
  {
    id: 'chaos',
    name: 'Chaos',
    description: 'Every tap rolls the dice: usually normal, sometimes ×2 or ×3, sometimes shot-ified.',
  },
]

export function getModifiers(ids = []) {
  return MODIFIERS.filter((m) => ids.includes(m.id))
}

// Chaos is a per-tap dice roll, not a flat multiplier: most taps are unaffected,
// but some get doubled, tripled, or turned into a shot outright.
function rollChaos() {
  const r = Math.random()
  if (r < 0.45) return { factor: 1, shotify: false, label: null }
  if (r < 0.7) return { factor: 2, shotify: false, label: '×2' }
  if (r < 0.85) return { factor: 3, shotify: false, label: '×3' }
  return { factor: 1, shotify: true, label: 'shot-ified' }
}

// Combines active modifiers + any pending per-player multiplier (from a multiplier
// card) with a base drink outcome. Order: Chaos's roll + the card multiplier scale
// severity up (used for scoring), then No Shots caps the *delivered* instruction
// back down to one drink (capping what you drink, not what it's worth), then Clean
// zeroes the delivered drink out entirely while keeping the points.
export function resolveDrink(baseDrink, modifierIds = [], playerMultiplier = 1) {
  const active = new Set(modifierIds)
  const chaosActive = active.has('chaos')
  const roll = chaosActive ? rollChaos() : { factor: 1, shotify: false, label: null }

  const severityType = roll.shotify ? 'shot' : baseDrink.type
  const severityAmount = (roll.shotify ? 1 : baseDrink.amount) * roll.factor * playerMultiplier
  const points = pointsForDrink({ type: severityType, amount: severityAmount })

  let deliveredType = severityType
  let deliveredAmount = severityAmount
  if (active.has('no-shots')) {
    deliveredType = 'count'
    deliveredAmount = 1
  }

  const chaosRoll = chaosActive ? roll.label : null

  if (active.has('clean')) {
    return { drink: { type: 'count', amount: 0 }, points, alcohol: false, chaosRoll }
  }

  return { drink: { type: deliveredType, amount: deliveredAmount }, points, alcohol: true, chaosRoll }
}

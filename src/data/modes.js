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
    description: 'Double every drink amount and point value.',
  },
]

export function getModifiers(ids = []) {
  return MODIFIERS.filter((m) => ids.includes(m.id))
}

// Combines active modifiers + any pending per-player multiplier (from a multiplier
// card) with a base drink outcome. Order: Chaos/multiplier scale amount up,
// then No Shots caps it back down, then Clean zeroes alcohol out entirely.
export function resolveDrink(baseDrink, modifierIds = [], playerMultiplier = 1) {
  const active = new Set(modifierIds)
  let amount = baseDrink.amount * (active.has('chaos') ? 2 : 1) * playerMultiplier
  let type = baseDrink.type

  if (active.has('no-shots')) {
    type = 'count'
    amount = 1
  }

  const points = pointsForDrink({ type: baseDrink.type, amount: baseDrink.amount }) *
    (active.has('chaos') ? 2 : 1) *
    playerMultiplier

  if (active.has('clean')) {
    return { drink: { type: 'count', amount: 0 }, points, alcohol: false }
  }

  return { drink: { type, amount }, points, alcohol: true }
}

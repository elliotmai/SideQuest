export const MODES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Points convert to drinks as normal.',
    multiplier: 1,
    alcohol: true,
    maxDrinksPerEvent: null,
  },
  {
    id: 'no-shots',
    name: 'No Shots',
    description: 'Same points, but no single event ever costs more than one drink.',
    multiplier: 1,
    alcohol: true,
    maxDrinksPerEvent: 1,
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Family-friendly — points only, no drinks. Losers do a silly forfeit.',
    multiplier: 1,
    alcohol: false,
    maxDrinksPerEvent: 0,
  },
  {
    id: 'chaos',
    name: 'Chaos',
    description: 'Double points, double drinks. Not for the faint of liver.',
    multiplier: 2,
    alcohol: true,
    maxDrinksPerEvent: null,
  },
]

export function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES[0]
}

// Default: every `pointsPerDrink` points earned = 1 drink.
export const DEFAULT_POINTS_PER_DRINK = 2

export function resolveEvent(event, mode, pointsPerDrink = DEFAULT_POINTS_PER_DRINK) {
  const points = event.points * mode.multiplier
  if (!mode.alcohol) {
    return { points, drinks: 0, unit: 'points' }
  }
  let drinks = points / pointsPerDrink
  if (mode.maxDrinksPerEvent != null) {
    drinks = Math.min(drinks, mode.maxDrinksPerEvent)
  }
  return { points, drinks, unit: 'drinks' }
}

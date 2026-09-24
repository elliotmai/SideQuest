// A drink outcome: { type, amount }. `amount` is "how many" of that unit —
// scaled by mode caps (No Shots) and multiplier cards.
export const DRINK_TYPES = [
  { id: 'count', label: (amount) => `${amount} drink${amount > 1 ? 's' : ''}`, basePoints: 1 },
  { id: 'shot', label: (amount) => (amount > 1 ? `${amount} shots` : 'Take a shot'), basePoints: 4 },
  { id: 'finish', label: (amount) => (amount > 1 ? `Finish ${amount} drinks` : 'Finish your drink'), basePoints: 5 },
  { id: 'shotgun', label: (amount) => (amount > 1 ? `Shotgun ${amount} drinks` : 'Shotgun a drink'), basePoints: 6 },
]

export function getDrinkType(id) {
  return DRINK_TYPES.find((d) => d.id === id) || DRINK_TYPES[0]
}

export function drinkLabel(drink) {
  return getDrinkType(drink.type).label(drink.amount)
}

export function pointsForDrink(drink) {
  return getDrinkType(drink.type).basePoints * drink.amount
}

export function drink(type, amount = 1) {
  return { type, amount }
}

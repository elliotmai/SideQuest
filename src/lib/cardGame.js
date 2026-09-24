// Builds a personal play deck: `cardCount` copies of each event (score or
// multiplier), independent of the physical 52-card mapping used for printing
// (data/cards.js) — this deck just needs enough instances to deal a hand and
// keep the stock/discard piles meaningful, however many events a pack has.
export function buildDeckInstances(events) {
  const instances = []
  events.forEach((event) => {
    const count = Math.max(1, event.cardCount || 1)
    for (let i = 0; i < count; i++) {
      instances.push({ id: `${event.id}-${i}-${Math.random().toString(36).slice(2, 8)}`, eventId: event.id })
    }
  })
  return instances
}

export function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealHand(instances, handSize = 5) {
  const shuffled = shuffle(instances)
  return { hand: shuffled.slice(0, handSize), stock: shuffled.slice(handSize) }
}

// Plays the card at `index` out of `hand`, discards it, and refills that slot
// from `stock` — reshuffling `discard` back into the stock once it runs dry,
// so the game never just stops. Returns the new { hand, stock, discard,
// playedCard, drawnCard } — drawnCard is null only if there are truly no
// cards left anywhere (an empty deck).
export function playCard(hand, stock, discard, index) {
  const newHand = [...hand]
  const [playedCard] = newHand.splice(index, 1)
  const newDiscard = [...discard, playedCard]

  let newStock = [...stock]
  if (newStock.length === 0 && newDiscard.length > 0) {
    newStock = shuffle(newDiscard)
    newDiscard.length = 0
  }

  const drawnCard = newStock.shift() ?? null
  if (drawnCard) newHand.splice(index, 0, drawnCard)

  return { hand: newHand, stock: newStock, discard: newDiscard, playedCard, drawnCard }
}

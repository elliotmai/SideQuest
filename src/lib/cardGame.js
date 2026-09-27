// Builds the session's one shared play deck: `cardCount` copies of each
// event (score or multiplier), independent of the physical 52-card mapping
// used for printing (data/cards.js) — this deck just needs enough instances
// for every player at the table to deal hands from and keep the shared
// stock/discard piles meaningful, however many events a pack has.
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

// Pulls `count` cards off the front of a single shared `stock` pile,
// reshuffling `discard` back into it partway through if it runs dry — so a
// hand can be dealt, or a card replaced, straight out of one pile the whole
// table shares, rather than each player holding their own copy. `drawn` may
// come back shorter than `count` only if there are truly no cards left
// anywhere across both piles.
export function drawCards(stock, discard, count) {
  let newStock = [...stock]
  let newDiscard = [...discard]
  const drawn = []
  for (let i = 0; i < count; i++) {
    if (newStock.length === 0 && newDiscard.length > 0) {
      newStock = shuffle(newDiscard)
      newDiscard = []
    }
    const card = newStock.shift()
    if (!card) break
    drawn.push(card)
  }
  return { drawn, stock: newStock, discard: newDiscard }
}

// Plays the card at `index` out of a player's own `hand`, discards it onto
// the shared `stock`/`discard` piles, and refills that slot by drawing one
// card off the same shared stock. Returns the new { hand, stock, discard,
// playedCard, drawnCard } — drawnCard is null only if there are truly no
// cards left anywhere (an empty deck).
export function playSharedCard(hand, stock, discard, index) {
  const newHand = [...hand]
  const [playedCard] = newHand.splice(index, 1)
  const { drawn, stock: newStock, discard: newDiscard } = drawCards(stock, [...discard, playedCard], 1)
  const drawnCard = drawn[0] ?? null
  if (drawnCard) newHand.splice(index, 0, drawnCard)

  return { hand: newHand, stock: newStock, discard: newDiscard, playedCard, drawnCard }
}

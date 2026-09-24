const SUITS = [
  { symbol: '♠', name: 'Spades' },
  { symbol: '♥', name: 'Hearts' },
  { symbol: '♦', name: 'Diamonds' },
  { symbol: '♣', name: 'Clubs' },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// Standard 52-card deck in a fixed order, plus 2 jokers — the two "wild" slots
// a pack's multiplier cards map onto.
export const STANDARD_DECK = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ label: `${rank} of ${suit.name}`, rank, suit: suit.symbol })),
)
export const JOKERS = [
  { label: 'Joker (Red)', rank: 'Joker', suit: '🃏' },
  { label: 'Joker (Black)', rank: 'Joker', suit: '🃏' },
]

// Walks a deck's events in order, handing each `cardCount` consecutive real cards
// (score events) or jokers (multiplier events). Returns the full 54-slot mapping
// plus totals so callers (admin, print view) can tell whether a deck is a clean
// 1:1 match for a physical deck of cards (52 scored + 2 joker slots used exactly).
export function buildCardAssignments(events = []) {
  let cardIndex = 0
  let jokerIndex = 0
  const assignments = []

  for (const event of events) {
    const count = event.cardCount || 0
    for (let i = 0; i < count; i++) {
      if (event.kind === 'multiplier') {
        const joker = JOKERS[jokerIndex]
        if (joker) assignments.push({ card: joker, event })
        jokerIndex++
      } else {
        const card = STANDARD_DECK[cardIndex]
        if (card) assignments.push({ card, event })
        cardIndex++
      }
    }
  }

  return {
    assignments,
    scoreCardsUsed: cardIndex,
    jokersUsed: jokerIndex,
    isFullDeck: cardIndex === STANDARD_DECK.length && jokerIndex === JOKERS.length,
  }
}

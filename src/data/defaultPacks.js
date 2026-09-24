import { drink } from './drinks'

// Event `kind`: 'score' (tap it, get a drink instruction) or 'multiplier' (tap it,
// your NEXT scored event this game is multiplied).
// `cardCount`: how many of a standard deck's 52 cards (or, for a multiplier
// event, of the 2 jokers) map to this event — see data/cards.js. Every pack's
// score events sum to 52 and multiplier events sum to 2, so the whole pack is a
// drop-in replacement for a physical deck of cards (see the /print/pack/:id view).
// Seed data only — the live source of truth is the `packs` Firestore collection,
// which admins can edit/extend without a code deploy (see lib/decks.js).
export const DEFAULT_PACKS = [
  {
    id: 'travel',
    name: 'Travel',
    emoji: '✈️',
    description: 'For flights, airports, and road trips.',
    events: [
      { id: 'plane-clap', kind: 'score', label: 'Passengers clap when the plane lands', drink: drink('count', 1), cardCount: 7 },
      { id: 'airport-sprint', kind: 'score', label: 'You see someone running through the airport', drink: drink('count', 1), cardCount: 7 },
      { id: 'flight-attendant-question', kind: 'score', label: 'Someone asks a flight attendant a painfully obvious question', drink: drink('count', 2), cardCount: 5 },
      { id: 'baby-crying', kind: 'score', label: 'A baby starts crying', drink: drink('count', 1), cardCount: 7 },
      { id: 'overhead-bin-fight', kind: 'score', label: 'Someone struggles with the overhead bin for 10+ seconds', drink: drink('count', 1), cardCount: 7 },
      { id: 'seat-recline-tension', kind: 'score', label: 'Visible tension over a reclined seat', drink: drink('count', 2), cardCount: 5 },
      { id: 'gate-change', kind: 'score', label: 'Your gate changes', drink: drink('count', 1), cardCount: 7 },
      { id: 'turbulence-gasp', kind: 'score', label: 'Turbulence makes someone audibly gasp', drink: drink('finish'), cardCount: 2 },
      { id: 'lost-luggage', kind: 'score', label: 'Someone at baggage claim looks visibly worried their bag is lost', drink: drink('count', 2), cardCount: 5 },
      { id: 'jetway-lucky', kind: 'multiplier', label: 'Lucky boarding pass', factor: 2, cardCount: 2 },
    ],
  },
  {
    id: 'beach-day',
    name: 'Beach Day',
    emoji: '🏖️',
    description: 'For the beach, pool, or lake.',
    events: [
      { id: 'kid-crying', kind: 'score', label: 'A child starts crying', drink: drink('count', 1), cardCount: 8 },
      { id: 'see-a-dog', kind: 'score', label: 'You spot a dog', drink: drink('count', 1), cardCount: 8 },
      { id: 'wardrobe-malfunction', kind: 'score', label: 'Wardrobe malfunction', drink: drink('shot'), cardCount: 4 },
      { id: 'runaway-umbrella', kind: 'score', label: 'A beach umbrella flies away', drink: drink('count', 2), cardCount: 6 },
      { id: 'broken-chair', kind: 'score', label: 'Someone’s chair collapses or breaks', drink: drink('shot'), cardCount: 4 },
      { id: 'severe-sunburn', kind: 'score', label: 'You spot a severe sunburn', drink: drink('count', 2), cardCount: 6 },
      { id: 'sand-in-food', kind: 'score', label: 'Someone complains about sand in their food', drink: drink('count', 1), cardCount: 8 },
      { id: 'seagull-steals-food', kind: 'score', label: 'A bird steals someone’s food', drink: drink('count', 2), cardCount: 6 },
      { id: 'someone-falls-in-water', kind: 'score', label: 'Someone unexpectedly falls in the water', drink: drink('finish'), cardCount: 2 },
      { id: 'tide-turner', kind: 'multiplier', label: 'Riptide card', factor: 2, cardCount: 2 },
    ],
  },
  {
    id: 'general-outing',
    name: 'General Outing',
    emoji: '🎉',
    description: 'Works for basically any hangout.',
    events: [
      { id: 'phone-drop', kind: 'score', label: 'Someone drops their phone', drink: drink('count', 1), cardCount: 7 },
      { id: 'trip-stumble', kind: 'score', label: 'Someone trips or stumbles', drink: drink('count', 1), cardCount: 7 },
      { id: 'mirror-selfie', kind: 'score', label: 'You catch someone taking a selfie', drink: drink('count', 1), cardCount: 7 },
      { id: 'public-argument', kind: 'score', label: 'A stranger-couple argument breaks out nearby', drink: drink('count', 2), cardCount: 5 },
      { id: 'wrong-order', kind: 'score', label: 'Someone gets the wrong order', drink: drink('count', 1), cardCount: 7 },
      { id: 'group-photo-retake', kind: 'score', label: 'A group photo needs 3+ retakes', drink: drink('count', 1), cardCount: 7 },
      { id: 'lost-item', kind: 'score', label: 'Someone can’t find something in their bag/pockets', drink: drink('count', 1), cardCount: 7 },
      { id: 'unexpected-celebrity-lookalike', kind: 'score', label: 'Someone points out a celebrity lookalike', drink: drink('count', 2), cardCount: 5 },
      { id: 'wildcard', kind: 'multiplier', label: 'Wildcard', factor: 3, cardCount: 2 },
    ],
  },
  {
    id: 'football-last-leg',
    name: 'Football (Last Leg)',
    emoji: '🏈',
    description: 'The classic — live for gameday.',
    events: [
      { id: 'pass-over-5', kind: 'score', label: 'Completed pass over 5 yards', drink: drink('count', 1), cardCount: 6 },
      { id: 'pass-over-10', kind: 'score', label: 'Completed pass over 10 yards', drink: drink('count', 2), cardCount: 5 },
      { id: 'pass-over-20', kind: 'score', label: 'Completed pass over 20 yards', drink: drink('count', 3), cardCount: 4 },
      { id: 'fourth-down-conversion', kind: 'score', label: '4th down conversion', drink: drink('count', 2), cardCount: 5 },
      { id: 'touchdown', kind: 'score', label: 'Touchdown', drink: drink('finish'), cardCount: 3 },
      { id: 'interception', kind: 'score', label: 'Interception', drink: drink('shot'), cardCount: 2 },
      { id: 'fumble', kind: 'score', label: 'Fumble', drink: drink('shot'), cardCount: 2 },
      { id: 'field-goal', kind: 'score', label: 'Field goal', drink: drink('count', 1), cardCount: 6 },
      { id: 'penalty-flag', kind: 'score', label: 'Penalty flag thrown', drink: drink('count', 1), cardCount: 6 },
      { id: 'missed-field-goal', kind: 'score', label: 'Missed field goal', drink: drink('count', 2), cardCount: 5 },
      { id: 'sack', kind: 'score', label: 'Sack', drink: drink('count', 1), cardCount: 6 },
      { id: 'pick-six', kind: 'score', label: 'Pick six', drink: drink('shotgun'), cardCount: 2 },
      { id: 'two-minute-drill', kind: 'multiplier', label: 'Two-minute drill', factor: 2, cardCount: 2 },
    ],
  },
]

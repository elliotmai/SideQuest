import { drink } from './drinks'

// Expansions layer extra events onto whichever base pack you picked.
// Seed data only — live source of truth is the `expansions` Firestore collection.
export const DEFAULT_EXPANSIONS = [
  {
    id: 'bad-person',
    name: 'Bad Person',
    emoji: '😈',
    description: 'For the mischief-inclined. Stacks onto any pack.',
    events: [
      { id: 'steal-a-fry', kind: 'score', label: 'Steal food off someone’s plate without asking', drink: drink('count', 1) },
      { id: 'let-them-pay', kind: 'score', label: 'Let someone else grab the bill and say nothing', drink: drink('count', 2) },
      { id: 'white-lie', kind: 'score', label: 'Tell a harmless white lie to get out of something', drink: drink('count', 1) },
      { id: 'ghost-a-text', kind: 'score', label: 'Leave someone on read on purpose', drink: drink('count', 1) },
      { id: 'petty-gossip', kind: 'score', label: 'Share a mildly petty opinion about someone not present', drink: drink('count', 2) },
      { id: 'take-credit', kind: 'score', label: 'Take a little too much credit for a group effort', drink: drink('shot') },
      { id: 'karma-card', kind: 'multiplier', label: 'Karma’s coming', factor: 2 },
    ],
  },
]

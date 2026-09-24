import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPackOnce, getExpansionOnce } from '../lib/decks'
import { buildCardAssignments } from '../data/cards'
import { drinkLabel, pointsForDrink } from '../data/drinks'
import { resolvePackIcon } from '../lib/packIcon'
import Loading from '../components/Loading'

export default function Print() {
  const { kind, id } = useParams()
  const [deck, setDeck] = useState(undefined)
  const DeckIcon = useMemo(() => resolvePackIcon(deck), [deck])

  useEffect(() => {
    const fetcher = kind === 'expansion' ? getExpansionOnce : getPackOnce
    fetcher(id).then(setDeck)
  }, [kind, id])

  if (deck === undefined)
    return (
      <div className="page">
        <Loading />
      </div>
    )
  if (deck === null) return <div className="page">Deck not found.</div>

  const { assignments, scoreCardsUsed, jokersUsed, isFullDeck } = buildCardAssignments(deck.events)

  return (
    <div className="page print-page">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DeckIcon size={24} strokeWidth={2.25} />
          {deck.name}
        </h1>
        <button className="primary" style={{ width: 'auto' }} onClick={() => window.print()}>
          Print
        </button>
      </div>

      {!isFullDeck && (
        <p className="hint no-print">
          Heads up: this deck uses {scoreCardsUsed}/52 standard cards and {jokersUsed}/2 jokers — not a
          clean 1:1 match for a physical deck yet.
        </p>
      )}

      <table className="print-table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Event</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(({ card, event }, i) => (
            <tr key={`${event.id}-${i}`}>
              <td>{card.label}</td>
              <td>{event.label}</td>
              <td>
                {event.kind === 'multiplier'
                  ? `×${event.factor} multiplier`
                  : (() => {
                      const pts = event.points ?? pointsForDrink(event.drink)
                      return `${drinkLabel(event.drink)} · ${pts} pt${pts === 1 ? '' : 's'}`
                    })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

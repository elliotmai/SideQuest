import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  subscribePacks,
  subscribeExpansions,
  savePack,
  deletePack,
  saveExpansion,
  deleteExpansion,
  seedDefaults,
  slugify,
} from '../lib/decks'
import { STANDARD_DECK, JOKERS } from '../data/cards'

const emptyEvent = () => ({
  id: `evt-${Math.random().toString(36).slice(2, 8)}`,
  kind: 'score',
  label: '',
  drink: { type: 'count', amount: 1 },
  factor: 2,
  cardCount: 1,
})

function DeckEditor({ deck, onSave, onCancel }) {
  const [name, setName] = useState(deck?.name || '')
  const [emoji, setEmoji] = useState(deck?.emoji || '🎲')
  const [description, setDescription] = useState(deck?.description || '')
  const [events, setEvents] = useState(deck?.events || [emptyEvent()])

  function updateEvent(index, patch) {
    setEvents((evts) => evts.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function handleSave() {
    if (!name.trim() || events.some((e) => !e.label.trim())) return
    onSave({
      id: deck?.id || slugify(name),
      name: name.trim(),
      emoji,
      description,
      events,
    })
  }

  const scoreCardTotal = events
    .filter((e) => e.kind === 'score')
    .reduce((sum, e) => sum + (e.cardCount || 0), 0)
  const jokerTotal = events
    .filter((e) => e.kind === 'multiplier')
    .reduce((sum, e) => sum + (e.cardCount || 0), 0)
  const deckIsClean = scoreCardTotal === STANDARD_DECK.length && jokerTotal === JOKERS.length

  return (
    <div className="card">
      <h2>{deck ? `Edit ${deck.name}` : 'New deck'}</h2>
      <p className="hint" style={{ color: deckIsClean ? undefined : 'var(--coral)' }}>
        Card deck total: {scoreCardTotal}/{STANDARD_DECK.length} standard cards, {jokerTotal}/
        {JOKERS.length} jokers{deckIsClean ? ' — matches a real deck ✓' : ''}
      </p>
      <div className="row">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ width: 60 }} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="One-line description"
      />

      <h2>Events</h2>
      {events.map((event, i) => (
        <div key={event.id} className="card" style={{ gap: '0.5rem' }}>
          <div className="row">
            <input
              value={event.label}
              onChange={(e) => updateEvent(i, { label: e.target.value })}
              placeholder="Event text (e.g. Touchdown)"
            />
            <select
              value={event.kind}
              onChange={(e) =>
                updateEvent(i, {
                  kind: e.target.value,
                  drink: e.target.value === 'score' ? { type: 'count', amount: 1 } : undefined,
                  factor: e.target.value === 'multiplier' ? 2 : undefined,
                })
              }
            >
              <option value="score">Score</option>
              <option value="multiplier">Multiplier card</option>
            </select>
          </div>
          {event.kind === 'score' ? (
            <div className="row">
              <select
                value={event.drink.type}
                onChange={(e) => updateEvent(i, { drink: { ...event.drink, type: e.target.value } })}
              >
                <option value="count">Drink(s)</option>
                <option value="shot">Shot</option>
                <option value="finish">Finish your drink</option>
                <option value="shotgun">Shotgun a drink</option>
              </select>
              {event.drink.type === 'count' && (
                <select
                  value={event.drink.amount}
                  onChange={(e) => updateEvent(i, { drink: { ...event.drink, amount: Number(e.target.value) } })}
                >
                  <option value={1}>1 drink</option>
                  <option value={2}>2 drinks</option>
                  <option value={3}>3 drinks</option>
                </select>
              )}
            </div>
          ) : (
            <div className="row">
              <label className="field-label" style={{ alignSelf: 'center' }}>
                Multiplier factor
              </label>
              <select value={event.factor} onChange={(e) => updateEvent(i, { factor: Number(e.target.value) })}>
                <option value={2}>×2</option>
                <option value={3}>×3</option>
              </select>
            </div>
          )}
          <div className="row">
            <label className="field-label" style={{ alignSelf: 'center' }}>
              {event.kind === 'multiplier' ? 'Jokers' : 'Cards'} for this event
            </label>
            <input
              type="number"
              min={0}
              max={event.kind === 'multiplier' ? 2 : 52}
              value={event.cardCount ?? 0}
              onChange={(e) => updateEvent(i, { cardCount: Number(e.target.value) })}
              style={{ width: 70 }}
            />
          </div>
          <button onClick={() => setEvents((evts) => evts.filter((_, idx) => idx !== i))}>Remove event</button>
        </div>
      ))}
      <button onClick={() => setEvents((evts) => [...evts, emptyEvent()])}>+ Add event</button>

      <div className="row">
        <button className="primary" onClick={handleSave}>
          Save deck
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function DeckSection({ title, decks, onDelete, saveFn }) {
  const [editing, setEditing] = useState(null) // deck object, or {} for new, or null

  return (
    <section className="card">
      <h2>{title}</h2>
      {decks.map((deck) => (
        <div key={deck.id} className="row" style={{ justifyContent: 'space-between' }}>
          <span>
            {deck.emoji} {deck.name} ({deck.events?.length || 0} events)
          </span>
          <div className="row">
            <button onClick={() => setEditing(deck)}>Edit</button>
            <button onClick={() => onDelete(deck.id)}>Delete</button>
          </div>
        </div>
      ))}
      {editing ? (
        <DeckEditor
          deck={editing.id ? editing : null}
          onSave={async (data) => {
            await saveFn(data)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing({})}>+ New</button>
      )}
    </section>
  )
}

export default function Admin() {
  const { profile } = useAuth()
  const [packs, setPacks] = useState([])
  const [expansions, setExpansions] = useState([])
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    const unsub1 = subscribePacks(setPacks)
    const unsub2 = subscribeExpansions(setExpansions)
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  if (!profile?.isAdmin) {
    return (
      <div className="page">
        <h1>Admin</h1>
        <p className="hint">This account isn&rsquo;t an admin.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Admin</h1>

      <section className="card">
        <h2>Seed defaults</h2>
        <p className="hint">
          Writes the built-in packs and expansions into Firestore. Safe to run again — it overwrites
          any built-in deck back to its default (won&rsquo;t touch decks with a different id).
        </p>
        <button
          disabled={seeding}
          onClick={async () => {
            setSeeding(true)
            await seedDefaults()
            setSeeding(false)
          }}
        >
          {seeding ? 'Seeding...' : 'Seed built-in decks'}
        </button>
      </section>

      <DeckSection title="Packs" decks={packs} saveFn={savePack} onDelete={deletePack} />
      <DeckSection title="Expansions" decks={expansions} saveFn={saveExpansion} onDelete={deleteExpansion} />
    </div>
  )
}

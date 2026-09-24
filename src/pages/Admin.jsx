import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { pointsForDrink } from '../data/drinks'
import { importDeckFile } from '../lib/importDeck'
import { resolvePackIcon } from '../lib/packIcon'

const IMPORT_ACCEPT = '.json,.xlsx,.xls,.csv,application/json,text/csv'

const emptyEvent = () => ({
  id: `evt-${Math.random().toString(36).slice(2, 8)}`,
  kind: 'score',
  label: '',
  drink: { type: 'count', amount: 1 },
  points: pointsForDrink({ type: 'count', amount: 1 }),
  factor: 2,
  cardCount: 1,
})

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function DeckEditor({ deck, onSave, onCancel }) {
  const [name, setName] = useState(deck?.name || '')
  const [emoji, setEmoji] = useState(deck?.emoji || '🎲')
  const [description, setDescription] = useState(deck?.description || '')
  const [events, setEvents] = useState(deck?.events || [emptyEvent()])
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

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

  function handleExport() {
    downloadJson(
      { id: deck?.id || slugify(name || 'deck'), name, emoji, description, events },
      `${deck?.id || slugify(name || 'deck')}.json`,
    )
  }

  async function handleImportFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const data = await importDeckFile(file)
      setName(data.name)
      setEmoji(data.emoji || '🎲')
      setDescription(data.description || '')
      setEvents(
        data.events.map((ev) => ({
          id: ev.id || `evt-${Math.random().toString(36).slice(2, 8)}`,
          kind: ev.kind === 'multiplier' ? 'multiplier' : 'score',
          label: ev.label || '',
          drink: ev.drink || { type: 'count', amount: 1 },
          points: ev.points ?? (ev.drink ? pointsForDrink(ev.drink) : undefined),
          factor: ev.factor || 2,
          cardCount: ev.cardCount ?? 1,
        })),
      )
      if (data.warnings?.length) {
        setImportError(`Imported with notes: ${data.warnings.join(' ')}`)
      }
    } catch (err) {
      setImportError(err.message)
    }
  }

  const scoreCardTotal = events
    .filter((e) => e.kind === 'score')
    .reduce((sum, e) => sum + (e.cardCount || 0), 0)
  const jokerTotal = events
    .filter((e) => e.kind === 'multiplier')
    .reduce((sum, e) => sum + (e.cardCount || 0), 0)
  const deckIsClean = scoreCardTotal === STANDARD_DECK.length && jokerTotal === JOKERS.length

  return (
    <div className="card admin-editor">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{deck ? `Edit ${deck.name}` : 'New deck'}</h2>
        <div className="row">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import file
          </button>
          <button type="button" onClick={handleExport}>
            Export JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <p className="hint">
        Import a .json export, or an .xlsx/.csv with columns Card Name, Drink (e.g. &ldquo;2
        Drinks&rdquo;, &ldquo;Shot&rdquo;, &ldquo;Shotgun a beer&rdquo;), Points (optional), Card Count.
      </p>
      {importError && <p className="hint" style={{ color: 'var(--coral)' }}>{importError}</p>}

      <div className={`admin-totals-banner ${deckIsClean ? 'ok' : 'warn'}`}>
        {scoreCardTotal}/{STANDARD_DECK.length} standard cards &middot; {jokerTotal}/{JOKERS.length} jokers
        {deckIsClean ? ' — matches a real deck ✓' : ''}
      </div>

      <div className="admin-header-fields">
        <div className="field-stack" style={{ flex: 'none', width: 64 }}>
          <label className="field-label">Emoji</label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </div>
        <div className="field-stack" style={{ flex: 1 }}>
          <label className="field-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deck name" />
        </div>
      </div>
      <div className="field-stack">
        <label className="field-label">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One-line description"
        />
      </div>

      <h2 style={{ marginTop: '0.5rem' }}>Events</h2>
      <div className="admin-event-list">
        {events.map((event, i) => (
          <div key={event.id} className="admin-event-row">
            <div className="admin-event-index">{i + 1}</div>
            <div className="admin-event-body">
              <input
                value={event.label}
                onChange={(e) => updateEvent(i, { label: e.target.value })}
                placeholder="Event text (e.g. Touchdown)"
              />

              <div className="admin-event-controls">
                <div className="field-stack">
                  <label className="field-label">Kind</label>
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
                  <>
                    <div className="field-stack">
                      <label className="field-label">Drink</label>
                      <select
                        value={event.drink.type}
                        onChange={(e) => {
                          const drink = { ...event.drink, type: e.target.value }
                          updateEvent(i, { drink, points: pointsForDrink(drink) })
                        }}
                      >
                        <option value="count">Drink(s)</option>
                        <option value="shot">Shot</option>
                        <option value="finish">Finish your drink</option>
                        <option value="shotgun">Shotgun a drink</option>
                      </select>
                    </div>
                    {event.drink.type === 'count' && (
                      <div className="field-stack">
                        <label className="field-label">Amount</label>
                        <select
                          value={event.drink.amount}
                          onChange={(e) => {
                            const drink = { ...event.drink, amount: Number(e.target.value) }
                            updateEvent(i, { drink, points: pointsForDrink(drink) })
                          }}
                        >
                          <option value={1}>1 drink</option>
                          <option value={2}>2 drinks</option>
                          <option value={3}>3 drinks</option>
                        </select>
                      </div>
                    )}
                    <div className="field-stack" style={{ width: 64 }}>
                      <label className="field-label">Points</label>
                      <input
                        type="number"
                        min={0}
                        value={event.points ?? pointsForDrink(event.drink)}
                        onChange={(e) => updateEvent(i, { points: Number(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="field-stack">
                    <label className="field-label">Factor</label>
                    <select
                      value={event.factor}
                      onChange={(e) => updateEvent(i, { factor: Number(e.target.value) })}
                    >
                      <option value={2}>×2</option>
                      <option value={3}>×3</option>
                    </select>
                  </div>
                )}

                <div className="field-stack" style={{ width: 70 }}>
                  <label className="field-label">{event.kind === 'multiplier' ? 'Jokers' : 'Cards'}</label>
                  <input
                    type="number"
                    min={0}
                    max={event.kind === 'multiplier' ? 2 : 52}
                    value={event.cardCount ?? 0}
                    onChange={(e) => updateEvent(i, { cardCount: Number(e.target.value) })}
                  />
                </div>

                <button
                  type="button"
                  className="admin-remove-event"
                  onClick={() => setEvents((evts) => evts.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEvents((evts) => [...evts, emptyEvent()])}>
        + Add event
      </button>

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
  const [importError, setImportError] = useState('')
  const importInputRef = useRef(null)

  async function handleImportNew(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const data = await importDeckFile(file)
      setEditing(data)
      if (data.warnings?.length) {
        setImportError(`Imported with notes: ${data.warnings.join(' ')}`)
      }
    } catch (err) {
      setImportError(err.message)
    }
  }

  return (
    <section className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title}</h2>
        <button type="button" onClick={() => importInputRef.current?.click()}>
          Import new deck
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          onChange={handleImportNew}
          style={{ display: 'none' }}
        />
      </div>
      {importError && <p className="hint" style={{ color: 'var(--coral)' }}>{importError}</p>}

      <div className="admin-deck-list">
        {decks.map((deck) => {
          const DeckIcon = resolvePackIcon(deck)
          return (
          <div key={deck.id} className="admin-deck-row">
            <span className="admin-deck-emoji">
              <DeckIcon size={20} strokeWidth={2.25} />
            </span>
            <div className="admin-deck-info">
              <div className="admin-deck-name">{deck.name}</div>
              <div className="hint">{deck.events?.length || 0} events</div>
            </div>
            <div className="row">
              <button onClick={() => setEditing(deck)}>Edit</button>
              <button onClick={() => onDelete(deck.id)}>Delete</button>
            </div>
          </div>
          )
        })}
      </div>

      {editing ? (
        <DeckEditor
          key={editing.id || 'new'}
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
        <Link to="/">&larr; Back to Side Quest</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin</h1>
        <Link to="/">&larr; Back to Side Quest</Link>
      </div>

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

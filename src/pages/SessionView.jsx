import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPackOnce, getExpansionOnce } from '../lib/decks'
import { resolveDrink } from '../data/modes'
import { drinkLabel } from '../data/drinks'
import { buildDeckInstances, dealHand, playCard } from '../lib/cardGame'
import RoadScene from '../components/RoadScene'
import {
  subscribeSession,
  subscribePlayers,
  subscribeEvents,
  logEvent,
  armMultiplier,
  joinSession,
  dealPlayerDeck,
  endSession,
  resumeSession,
  updateSessionNotes,
} from '../lib/session'

const ANIM_MS = 300

function HandRow({ hand, events, mini = false, onPlay, disabled, animClassFor }) {
  return (
    <div className={`hand-row ${mini ? 'mini' : ''}`}>
      {hand.map((card, i) => {
        const event = events.find((e) => e.id === card.eventId)
        const isMultiplier = event?.kind === 'multiplier'
        const animClass = animClassFor ? animClassFor(i) : ''
        const className = `play-card ${mini ? 'mini' : ''} ${isMultiplier ? 'multiplier' : ''} ${animClass}`
        const content = (
          <>
            <span className="play-card-label">{event?.label || '...'}</span>
            <span className="play-card-badge">
              {isMultiplier ? `×${event.factor}` : event ? drinkLabel(event.drink) : ''}
            </span>
          </>
        )
        return onPlay ? (
          <button key={card.id} className={className} onClick={() => onPlay(i)} disabled={disabled || !event}>
            {content}
          </button>
        ) : (
          <div key={card.id} className={className}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

export default function SessionView() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [session, setSession] = useState(undefined)
  const [pack, setPack] = useState(null)
  const [expansions, setExpansions] = useState([])
  const [players, setPlayers] = useState([])
  const [activity, setActivity] = useState([])
  const [myDeck, setMyDeck] = useState(null) // { hand, stock, discard } — locally owned, optimistic
  const [playingIndex, setPlayingIndex] = useState(null)
  const [incomingIndex, setIncomingIndex] = useState(null)
  const [expandedUid, setExpandedUid] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const dealtRef = useRef(false)

  useEffect(() => {
    const unsub1 = subscribeSession(code, setSession)
    const unsub2 = subscribePlayers(code, setPlayers)
    const unsub3 = subscribeEvents(code, setActivity)
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [code])

  useEffect(() => {
    if (!session) return
    getPackOnce(session.packId).then(setPack)
    Promise.all((session.expansionIds || []).map(getExpansionOnce)).then((list) =>
      setExpansions(list.filter(Boolean)),
    )
  }, [session])

  const notesLoadedRef = useRef(false)
  useEffect(() => {
    if (notesLoadedRef.current || !session) return
    notesLoadedRef.current = true
    setNotesDraft(session.notes || '')
  }, [session])

  // Auto-join if this device landed here directly without going through /join/:code.
  useEffect(() => {
    if (session && user && !players.some((p) => p.uid === user.uid)) {
      joinSession(code, { uid: user.uid, name: profile?.username || 'Guest' })
    }
  }, [session, players, user, code, profile])

  const events = useMemo(
    () => [...(pack?.events || []), ...expansions.flatMap((e) => e.events || [])],
    [pack, expansions],
  )
  const me = players.find((p) => p.uid === user?.uid)

  // Deal a hand once: either resume what's already saved, or deal a fresh one
  // the first time this player has events to build a deck from.
  useEffect(() => {
    if (dealtRef.current || !me || events.length === 0) return
    if (me.hand) {
      setMyDeck({ hand: me.hand, stock: me.stock || [], discard: me.discard || [] })
      dealtRef.current = true
      return
    }
    const instances = buildDeckInstances(events)
    const { hand, stock } = dealHand(instances, 5)
    dealtRef.current = true
    setMyDeck({ hand, stock, discard: [] })
    dealPlayerDeck(code, user.uid, { hand, stock, discard: [] })
  }, [me, events, code, user])

  if (session === undefined) return <div className="page">Loading...</div>
  if (session === null) return <div className="page">Game not found.</div>

  const shareUrl = `${window.location.origin}/join/${code}`
  const pendingMultiplier = me?.pendingMultiplier || 1
  const datesPlayed = session.datesPlayed || []

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      await updateSessionNotes(code, notesDraft)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleEndGame() {
    await endSession(code)
  }

  async function handleResumeGame() {
    await resumeSession(code)
  }

  async function playHandCard(index) {
    if (!myDeck || playingIndex !== null) return
    const card = myDeck.hand[index]
    const event = events.find((e) => e.id === card.eventId)

    const { hand, stock, discard } = playCard(myDeck.hand, myDeck.stock, myDeck.discard, index)
    const deck = { hand, stock, discard }

    setPlayingIndex(index)
    setTimeout(() => {
      setMyDeck(deck)
      setPlayingIndex(null)
      setIncomingIndex(index)
      setTimeout(() => setIncomingIndex(null), ANIM_MS)
    }, ANIM_MS)

    if (!event) {
      // Pack changed since this card was dealt — just discard/redraw silently.
      await dealPlayerDeck(code, user.uid, deck)
      return
    }

    if (event.kind === 'multiplier') {
      await armMultiplier(code, {
        uid: user.uid,
        name: profile?.username || 'Guest',
        eventId: event.id,
        eventLabel: event.label,
        factor: event.factor,
        deck,
      })
    } else {
      const { drink, points } = resolveDrink(event.drink, session.modifierIds, pendingMultiplier, event.points)
      await logEvent(code, {
        uid: user.uid,
        name: profile?.username || 'Guest',
        eventId: event.id,
        eventLabel: event.label,
        drink,
        points,
        deck,
      })
    }
  }

  return (
    <div className="page">
      <div className="session-header">
        <h1>
          {pack?.emoji} {pack?.name}
        </h1>
        <p className="hint">
          Code: <strong>{code}</strong>
          {expansions.length > 0 && ` · ${expansions.map((e) => e.name).join(', ')}`}
        </p>
        <div className="row">
          <button onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy invite link</button>
          {session.packId && (
            <button onClick={() => navigate(`/print/pack/${session.packId}`)}>🖨️ Print cards</button>
          )}
        </div>
        {pack && <RoadScene signText={`NOW ENTERING ${pack.name.toUpperCase()}`} subText="Pop. you & your crew" />}
      </div>

      {session.active === false && (
        <div className="flash-toast">This game has ended — reopen it to keep playing.</div>
      )}

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Game</h2>
          {session.active === false ? (
            <button onClick={handleResumeGame}>Resume game</button>
          ) : (
            <button onClick={handleEndGame}>End game</button>
          )}
        </div>
        {datesPlayed.length > 0 && (
          <p className="hint">Played on {datesPlayed.slice().sort().join(', ')}</p>
        )}
        <label className="field-label">Notes</label>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Who won, what happened, anything to remember..."
          rows={3}
        />
        {savingNotes && <p className="hint">Saving...</p>}
      </section>

      {pendingMultiplier > 1 && (
        <div className="flash-toast">×{pendingMultiplier} multiplier armed — your next tap counts double!</div>
      )}

      <section className="card">
        <h2>Scoreboard</h2>
        <ol className="scoreboard">
          {players.map((p, i) => (
            <li key={p.uid} className={p.uid === user.uid ? 'me' : ''}>
              <span className={`rank-badge ${i === 0 ? 'gold' : ''}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <span className="player-name">{p.name}</span>
              <span className="player-score">{p.score} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Activity</h2>
        <ol className="scoreboard">
          {activity.length === 0 && <li style={{ border: 'none' }}>No taps yet — be the first.</li>}
          {activity.slice(0, 12).map((entry) => (
            <li key={entry.id} style={{ border: 'none', background: 'transparent', padding: '0.25rem 0' }}>
              <span className="player-name" style={{ flex: 'none' }}>
                {entry.name}
              </span>
              <span className="player-score" style={{ flex: 1, textAlign: 'left', marginLeft: '0.5rem' }}>
                {entry.eventLabel} —{' '}
                {entry.multiplierArmed
                  ? `×${entry.multiplierArmed} armed`
                  : entry.drink
                    ? drinkLabel(entry.drink)
                    : `${entry.points} pts`}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Your cards</h2>
        {!myDeck ? (
          <p className="hint">Dealing your hand...</p>
        ) : (
          <>
            <div className="pile-row">
              <div className="pile">
                <div className="pile-card-back" />
                <span className="pile-count">{myDeck.stock.length}</span>
              </div>
              <p className="hint" style={{ margin: 0 }}>
                Tap a card when it happens — it discards and you draw a fresh one.
              </p>
              <div className="pile">
                <div className="pile-card-back discard" />
                <span className="pile-count">{myDeck.discard.length}</span>
              </div>
            </div>

            <HandRow
              hand={myDeck.hand}
              events={events}
              onPlay={playHandCard}
              disabled={playingIndex !== null}
              animClassFor={(i) => (playingIndex === i ? 'playing' : incomingIndex === i ? 'incoming' : '')}
            />
          </>
        )}
      </section>

      {players.some((p) => p.uid !== user.uid && p.hand?.length) && (
        <section className="card">
          <h2>Everyone else&rsquo;s cards</h2>
          <p className="hint">
            Handy mid-game if someone forgets what their card means — tap a name to see it full-size.
          </p>
          {players
            .filter((p) => p.uid !== user.uid && p.hand?.length)
            .map((p) => (
              <div key={p.uid} className="peek-player">
                <button className="peek-player-toggle" onClick={() => setExpandedUid((id) => (id === p.uid ? null : p.uid))}>
                  {p.name} {expandedUid === p.uid ? '▾' : '▸'}
                </button>
                <HandRow hand={p.hand} events={events} mini={expandedUid !== p.uid} />
              </div>
            ))}
        </section>
      )}
    </div>
  )
}

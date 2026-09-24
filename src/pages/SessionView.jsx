import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPackOnce, getExpansionOnce } from '../lib/decks'
import { resolveDrink } from '../data/modes'
import { drinkLabel } from '../data/drinks'
import RoadScene from '../components/RoadScene'
import {
  subscribeSession,
  subscribePlayers,
  subscribeEvents,
  logEvent,
  armMultiplier,
  joinSession,
} from '../lib/session'

export default function SessionView() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [session, setSession] = useState(undefined)
  const [pack, setPack] = useState(null)
  const [expansions, setExpansions] = useState([])
  const [players, setPlayers] = useState([])
  const [activity, setActivity] = useState([])
  const [flash, setFlash] = useState(null)

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

  // Auto-join if this device landed here directly without going through /join/:code.
  useEffect(() => {
    if (session && user && !players.some((p) => p.uid === user.uid)) {
      joinSession(code, { uid: user.uid, name: profile?.username || 'Guest' })
    }
  }, [session, players, user, code, profile])

  if (session === undefined) return <div className="page">Loading...</div>
  if (session === null) return <div className="page">Game not found.</div>

  const events = [...(pack?.events || []), ...expansions.flatMap((e) => e.events || [])]
  const shareUrl = `${window.location.origin}/join/${code}`
  const me = players.find((p) => p.uid === user.uid)
  const pendingMultiplier = me?.pendingMultiplier || 1

  async function handleScore(event) {
    const { drink, points, alcohol, chaosRoll } = resolveDrink(
      event.drink,
      session.modifierIds,
      pendingMultiplier,
      event.points,
    )
    await logEvent(code, {
      uid: user.uid,
      name: profile?.username || 'Guest',
      eventId: event.id,
      eventLabel: event.label,
      drink,
      points,
    })
    const label = alcohol ? drinkLabel(drink) : `${points} pts`
    const multiplierNote = pendingMultiplier > 1 ? ` (×${pendingMultiplier} multiplier used)` : ''
    const chaosNote = chaosRoll ? ` — 🎲 Chaos rolled ${chaosRoll}!` : ''
    setFlash({ text: `${event.label} — ${label}${multiplierNote}${chaosNote}` })
    setTimeout(() => setFlash(null), 2200)
  }

  async function handleMultiplier(event) {
    await armMultiplier(code, {
      uid: user.uid,
      name: profile?.username || 'Guest',
      eventId: event.id,
      eventLabel: event.label,
      factor: event.factor,
    })
    setFlash({ text: `${event.label} armed — your next drink is ×${event.factor}!` })
    setTimeout(() => setFlash(null), 2200)
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

      {pendingMultiplier > 1 && (
        <div className="flash-toast">×{pendingMultiplier} multiplier armed — your next tap counts double!</div>
      )}

      {flash && <div className="flash-toast">{flash.text}</div>}

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
        <h2>Tap when it happens</h2>
        <div className="event-grid">
          {events.map((event) =>
            event.kind === 'multiplier' ? (
              <button
                key={event.id}
                className="event-tile"
                style={{ background: 'var(--mustard)' }}
                onClick={() => handleMultiplier(event)}
              >
                {event.label}
                <span className="event-points">×{event.factor} CARD</span>
              </button>
            ) : (
              <button key={event.id} className="event-tile" onClick={() => handleScore(event)}>
                {event.label}
                <span className="event-points">{drinkLabel(event.drink)}</span>
              </button>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

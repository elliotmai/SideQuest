import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPack } from '../data/packs'
import { getMode, resolveEvent } from '../data/modes'
import { subscribeSession, subscribePlayers, logEvent, joinSession } from '../lib/session'

export default function SessionView() {
  const { code } = useParams()
  const { user, profile } = useAuth()
  const [session, setSession] = useState(undefined)
  const [players, setPlayers] = useState([])
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    const unsub1 = subscribeSession(code, setSession)
    const unsub2 = subscribePlayers(code, setPlayers)
    return () => {
      unsub1()
      unsub2()
    }
  }, [code])

  // Auto-join if this device landed here directly without going through /join/:code.
  useEffect(() => {
    if (session && user && !players.some((p) => p.uid === user.uid)) {
      joinSession(code, { uid: user.uid, name: profile?.username || 'Guest' })
    }
  }, [session, players, user, code, profile])

  if (session === undefined) return <div className="page">Loading...</div>
  if (session === null) return <div className="page">Game not found.</div>

  const pack = getPack(session.packId)
  const mode = getMode(session.modeId)
  const shareUrl = `${window.location.origin}/join/${code}`

  async function handleTap(event) {
    const { points, drinks, unit } = resolveEvent(event, mode, session.pointsPerDrink)
    await logEvent(code, {
      uid: user.uid,
      name: profile?.username || 'Guest',
      eventId: event.id,
      eventLabel: event.label,
      points,
      drinks,
    })
    setFlash({ label: event.label, points, drinks, unit })
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div className="page">
      <div className="session-header">
        <h1>
          {pack?.emoji} {pack?.name}
        </h1>
        <p className="hint">
          {mode?.name} mode &middot; Code: <strong>{code}</strong>
        </p>
        <button onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy invite link</button>
      </div>

      {flash && (
        <div className="flash-toast">
          +{flash.points} pts{flash.unit === 'drinks' ? ` / +${flash.drinks.toFixed(1)} drinks` : ''} —{' '}
          {flash.label}
        </div>
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
              <span className="player-score">
                {p.score} pts{mode?.alcohol ? ` · ${(p.drinks || 0).toFixed(1)} drinks` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2>Tap when it happens</h2>
        <div className="event-grid">
          {pack?.events.map((event) => (
            <button key={event.id} className="event-tile" onClick={() => handleTap(event)}>
              {event.label}
              <span className="event-points">+{event.points * mode.multiplier}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

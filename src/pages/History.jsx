import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeMySessions } from '../lib/session'
import { getPackOnce } from '../lib/decks'
import Loading from '../components/Loading'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState(undefined)
  const [packs, setPacks] = useState({}) // packId -> pack

  useEffect(() => {
    if (!user) return
    return subscribeMySessions(user.uid, setSessions)
  }, [user])

  useEffect(() => {
    if (!sessions) return
    const missing = [...new Set(sessions.map((s) => s.packId))].filter((id) => id && !packs[id])
    if (missing.length === 0) return
    Promise.all(missing.map((id) => getPackOnce(id).then((p) => [id, p]))).then((pairs) => {
      setPacks((prev) => ({ ...prev, ...Object.fromEntries(pairs) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions])

  return (
    <div className="page">
      <h1>Game history</h1>
      <p className="hint">Every game you&rsquo;ve played, active or ended.</p>

      {sessions === undefined && <Loading label="Loading your games..." />}
      {sessions?.length === 0 && (
        <section className="card">
          <p className="hint" style={{ textAlign: 'center' }}>
            No games yet — start one from the home screen.
          </p>
        </section>
      )}

      {sessions?.map((s) => {
        const pack = packs[s.packId]
        const dates = (s.datesPlayed || []).slice().sort()
        const ended = s.active === false
        return (
          <section key={s.code} className="card">
            <div className="row between">
              <h2 style={{ margin: 0 }}>
                {pack?.emoji} {pack?.name || 'Game'}
              </h2>
              <span className={`status-pill ${ended ? 'ended' : 'active'}`}>{ended ? 'Ended' : 'Active'}</span>
            </div>
            <p className="hint">
              Code: <strong>{s.code}</strong>
              {dates.length > 0 && ` · Played ${dates.join(', ')}`}
            </p>
            {s.notes && <p className="hint">&ldquo;{s.notes}&rdquo;</p>}
            <button onClick={() => navigate(`/session/${s.code}`)}>{ended ? 'View / resume' : 'Rejoin'}</button>
          </section>
        )
      })}
    </div>
  )
}

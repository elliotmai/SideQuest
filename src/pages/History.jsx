import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeMySessions, updateSessionNotes, deleteSession } from '../lib/session'
import { getPackOnce } from '../lib/decks'
import Loading from '../components/Loading'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState(undefined)
  const [packs, setPacks] = useState({}) // packId -> pack
  const [editingCode, setEditingCode] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [confirmDeleteCode, setConfirmDeleteCode] = useState(null)
  const [deletingCode, setDeletingCode] = useState(null)

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

  function startEditingNotes(s) {
    setEditingCode(s.code)
    setNoteDraft(s.notes || '')
  }

  async function saveNotes(code) {
    setSavingNotes(true)
    try {
      await updateSessionNotes(code, noteDraft)
      setEditingCode(null)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleDelete(code) {
    setDeletingCode(code)
    try {
      await deleteSession(code)
      setConfirmDeleteCode(null)
    } finally {
      setDeletingCode(null)
    }
  }

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
            {editingCode === s.code ? (
              <>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Who won, what happened, anything to remember..."
                  rows={3}
                  autoFocus
                />
                <div className="row">
                  <button className="primary" onClick={() => saveNotes(s.code)} disabled={savingNotes}>
                    {savingNotes ? 'Saving...' : 'Save'}
                  </button>
                  <button className="ghost" onClick={() => setEditingCode(null)} disabled={savingNotes}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              s.notes && <p className="hint">&ldquo;{s.notes}&rdquo;</p>
            )}

            <div className="row">
              <button onClick={() => navigate(`/session/${s.code}`)}>{ended ? 'View / resume' : 'Rejoin'}</button>
              {editingCode !== s.code && (
                <button className="ghost" onClick={() => startEditingNotes(s)}>
                  Edit notes
                </button>
              )}
              {s.hostUid === user.uid &&
                (confirmDeleteCode === s.code ? (
                  <>
                    <button
                      className="ghost"
                      style={{ color: 'var(--coral-deep)' }}
                      onClick={() => handleDelete(s.code)}
                      disabled={deletingCode === s.code}
                    >
                      {deletingCode === s.code ? 'Deleting...' : 'Confirm delete'}
                    </button>
                    <button className="ghost" onClick={() => setConfirmDeleteCode(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="ghost" onClick={() => setConfirmDeleteCode(s.code)}>
                    Delete
                  </button>
                ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

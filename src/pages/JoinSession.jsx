import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSession, joinSession } from '../lib/session'
import { getPack } from '../data/packs'
import { getMode } from '../data/modes'

export default function JoinSession() {
  const { code } = useParams()
  const { user, profile, setUsername } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(undefined) // undefined = loading, null = not found
  const [nameDraft, setNameDraft] = useState(profile?.username || '')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    getSession(code).then(setSession)
  }, [code])

  async function handleJoin() {
    setJoining(true)
    try {
      if (nameDraft.trim() && nameDraft.trim() !== profile?.username) {
        await setUsername(nameDraft.trim())
      }
      await joinSession(code, { uid: user.uid, name: nameDraft.trim() || 'Guest' })
      navigate(`/session/${code}`)
    } finally {
      setJoining(false)
    }
  }

  if (session === undefined) return <div className="page">Loading...</div>
  if (session === null) {
    return (
      <div className="page">
        <h1>Game not found</h1>
        <p>Double check the code: {code}</p>
      </div>
    )
  }

  const pack = getPack(session.packId)
  const mode = getMode(session.modeId)

  return (
    <div className="page">
      <h1>Join game</h1>
      <div className="card">
        <div className="pack-emoji-big">{pack?.emoji}</div>
        <h2>{pack?.name}</h2>
        <p className="hint">{mode?.name} mode</p>
      </div>
      <section className="card">
        <label className="field-label">Your username</label>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Enter a username"
        />
      </section>
      <button className="primary" onClick={handleJoin} disabled={joining || !nameDraft.trim()}>
        {joining ? 'Joining...' : 'Join game'}
      </button>
    </div>
  )
}

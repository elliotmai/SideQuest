import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSession, joinSession } from '../lib/session'
import { getPackOnce } from '../lib/decks'
import { MODIFIERS } from '../data/modes'

export default function JoinSession() {
  const { code } = useParams()
  const { user, profile, setUsername } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(undefined) // undefined = loading, null = not found
  const [pack, setPack] = useState(null)
  const [nameDraft, setNameDraft] = useState(profile?.username || '')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    getSession(code).then(async (s) => {
      setSession(s)
      if (s?.packId) setPack(await getPackOnce(s.packId))
    })
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

  const activeModifiers = MODIFIERS.filter((m) => session.modifierIds?.includes(m.id))

  return (
    <div className="page">
      <h1>Join game</h1>
      <div className="card">
        <div className="pack-emoji-big">{pack?.emoji}</div>
        <h2>{pack?.name}</h2>
        <p className="hint">
          {activeModifiers.length ? activeModifiers.map((m) => m.name).join(' + ') : 'Standard'} rules
        </p>
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

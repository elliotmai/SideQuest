import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { profile, setUsername } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [nameDraft, setNameDraft] = useState(profile?.username || '')

  return (
    <div className="page">
      <h1 className="brand">Side Quest</h1>
      <p className="tagline">Turn any outing into a game.</p>

      <section className="card">
        <label className="field-label">Your username</label>
        <div className="row">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Enter a username"
          />
          <button onClick={() => setUsername(nameDraft.trim())} disabled={!nameDraft.trim()}>
            Save
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Start a new game</h2>
        <button className="primary" onClick={() => navigate('/create')}>
          Choose a pack &amp; start
        </button>
      </section>

      <section className="card">
        <h2>Join a game</h2>
        <div className="row">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g. 7F3K9Q)"
            maxLength={6}
          />
          <button onClick={() => joinCode && navigate(`/join/${joinCode}`)} disabled={!joinCode}>
            Join
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Friends &amp; groups</h2>
        <button onClick={() => navigate('/friends')}>Manage friends</button>
      </section>
    </div>
  )
}

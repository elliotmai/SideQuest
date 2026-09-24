import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PACKS } from '../data/packs'
import { MODES, DEFAULT_POINTS_PER_DRINK } from '../data/modes'
import { useAuth } from '../context/AuthContext'
import { createSession } from '../lib/session'

export default function CreateSession() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [packId, setPackId] = useState(PACKS[0].id)
  const [modeId, setModeId] = useState(MODES[0].id)
  const [pointsPerDrink, setPointsPerDrink] = useState(DEFAULT_POINTS_PER_DRINK)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    try {
      const code = await createSession({
        packId,
        modeId,
        pointsPerDrink: Number(pointsPerDrink),
        hostUid: user.uid,
        hostName: profile?.username || 'Host',
      })
      navigate(`/session/${code}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page">
      <h1>Start a game</h1>

      <section className="card">
        <h2>Pick a pack</h2>
        <div className="pack-grid">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              className={`pack-tile ${packId === pack.id ? 'selected' : ''}`}
              onClick={() => setPackId(pack.id)}
            >
              <div className="pack-emoji">{pack.emoji}</div>
              <div className="pack-name">{pack.name}</div>
              <div className="pack-desc">{pack.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Pick a mode</h2>
        <div className="mode-list">
          {MODES.map((mode) => (
            <label key={mode.id} className={`mode-row ${modeId === mode.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode"
                checked={modeId === mode.id}
                onChange={() => setModeId(mode.id)}
              />
              <div>
                <div className="mode-name">{mode.name}</div>
                <div className="mode-desc">{mode.description}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Points per drink</h2>
        <input
          type="number"
          min={1}
          value={pointsPerDrink}
          onChange={(e) => setPointsPerDrink(e.target.value)}
          style={{ width: 80 }}
        />
        <p className="hint">Every {pointsPerDrink} points earned = 1 drink.</p>
      </section>

      <button className="primary" onClick={handleCreate} disabled={creating}>
        {creating ? 'Creating...' : 'Create game & get link'}
      </button>
    </div>
  )
}

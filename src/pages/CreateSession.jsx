import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MODIFIERS } from '../data/modes'
import { useAuth } from '../context/AuthContext'
import { createSession } from '../lib/session'
import { subscribePacks, subscribeExpansions } from '../lib/decks'

function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export default function CreateSession() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [packs, setPacks] = useState([])
  const [expansions, setExpansions] = useState([])
  const [packId, setPackId] = useState(null)
  const [expansionIds, setExpansionIds] = useState([])
  const [modifierIds, setModifierIds] = useState([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const unsub1 = subscribePacks((list) => {
      setPacks(list)
      setPackId((current) => current ?? list[0]?.id ?? null)
    })
    const unsub2 = subscribeExpansions(setExpansions)
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  async function handleCreate() {
    if (!packId) return
    setCreating(true)
    try {
      const code = await createSession({
        packId,
        expansionIds,
        modifierIds,
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

      {packs.length === 0 && (
        <section className="card">
          <p className="hint">
            No packs found yet. If you&rsquo;re the admin, visit <a href="/admin">/admin</a> to seed the
            default packs.
          </p>
        </section>
      )}

      <section className="card">
        <h2><span className="card-icon coral">🎒</span> Pick a pack</h2>
        <div className="pack-grid">
          {packs.map((pack) => (
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
        {packId && (
          <Link to={`/print/pack/${packId}`} className="hint">
            🖨️ No phone? Print this pack as a real 52-card deck →
          </Link>
        )}
      </section>

      {expansions.length > 0 && (
        <section className="card">
          <h2><span className="card-icon mustard">➕</span> Expansions</h2>
          <p className="hint" style={{ marginTop: '-0.4rem' }}>Optional — stack as many as you like.</p>
          <div className="mode-list">
            {expansions.map((exp) => (
              <div key={exp.id}>
                <label className={`mode-row ${expansionIds.includes(exp.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={expansionIds.includes(exp.id)}
                    onChange={() => setExpansionIds((ids) => toggleId(ids, exp.id))}
                  />
                  <div>
                    <div className="mode-name">
                      {exp.emoji} {exp.name}
                    </div>
                    <div className="mode-desc">{exp.description}</div>
                  </div>
                </label>
                <Link to={`/print/expansion/${exp.id}`} className="hint" style={{ display: 'inline-block', marginTop: '0.25rem' }}>
                  🖨️ Print as cards →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2><span className="card-icon pine">⚙️</span> Modifiers</h2>
        <p className="hint" style={{ marginTop: '-0.4rem' }}>Optional — stack as many as you like.</p>
        <div className="mode-list">
          {MODIFIERS.map((mod) => (
            <label key={mod.id} className={`mode-row ${modifierIds.includes(mod.id) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={modifierIds.includes(mod.id)}
                onChange={() => setModifierIds((ids) => toggleId(ids, mod.id))}
              />
              <div>
                <div className="mode-name">{mod.name}</div>
                <div className="mode-desc">{mod.description}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <button className="primary" onClick={handleCreate} disabled={creating || !packId}>
        {creating ? 'Creating...' : 'Create game & get link'}
      </button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Backpack, PlusCircle, SlidersHorizontal, Printer } from 'lucide-react'
import { MODIFIERS } from '../data/modes'
import { useAuth } from '../context/AuthContext'
import { createSession } from '../lib/session'
import { subscribePacks, subscribeExpansions } from '../lib/decks'
import { resolvePackIcon } from '../lib/packIcon'
import CardIcon from '../components/CardIcon'

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
        <h2><CardIcon icon={Backpack} tone="coral" /> Pick a pack</h2>
        <div className="pack-grid">
          {packs.map((pack) => {
            const Icon = resolvePackIcon(pack)
            return (
              <button
                key={pack.id}
                className={`pack-tile ${packId === pack.id ? 'selected' : ''}`}
                onClick={() => setPackId(pack.id)}
              >
                <div className="pack-emoji">
                  <Icon size={20} strokeWidth={2.25} />
                </div>
                <div className="pack-name">{pack.name}</div>
                <div className="pack-desc">{pack.description}</div>
              </button>
            )
          })}
        </div>
        {packId && (
          <Link to={`/print/pack/${packId}`} className="hint print-link">
            <Printer size={14} strokeWidth={2.25} /> No phone? Print this pack as a real 52-card deck
          </Link>
        )}
      </section>

      {expansions.length > 0 && (
        <section className="card">
          <h2><CardIcon icon={PlusCircle} tone="mustard" /> Expansions</h2>
          <p className="hint" style={{ marginTop: '-0.4rem' }}>Optional — stack as many as you like.</p>
          <div className="mode-list">
            {expansions.map((exp) => {
              const ExpIcon = resolvePackIcon(exp)
              return (
              <div key={exp.id}>
                <label className={`mode-row ${expansionIds.includes(exp.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={expansionIds.includes(exp.id)}
                    onChange={() => setExpansionIds((ids) => toggleId(ids, exp.id))}
                  />
                  <div>
                    <div className="mode-name">
                      <ExpIcon
                        size={15}
                        strokeWidth={2.25}
                        style={{ marginRight: '0.3rem', verticalAlign: '-2px' }}
                      />
                      {exp.name}
                    </div>
                    <div className="mode-desc">{exp.description}</div>
                  </div>
                </label>
                <Link to={`/print/expansion/${exp.id}`} className="hint print-link" style={{ marginTop: '0.25rem' }}>
                  <Printer size={14} strokeWidth={2.25} /> Print as cards
                </Link>
              </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="card">
        <h2><CardIcon icon={SlidersHorizontal} tone="pine" /> Modifiers</h2>
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

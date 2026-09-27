import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dices, Users, NotebookText, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RoadScene from '../components/RoadScene'
import UsernameStatus from '../components/UsernameStatus'
import Avatar from '../components/Avatar'
import CardIcon from '../components/CardIcon'
import { useUsernameAvailability } from '../lib/useUsernameAvailability'
import { subscribeMySessions } from '../lib/session'
import { getPackOnce } from '../lib/decks'
import { subscribeMyInvites, dismissInvite } from '../lib/invites'

export default function Home() {
  const { user, profile, setUsername, signOut } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [nameDraft, setNameDraft] = useState(profile?.username || '')
  const [editingProfile, setEditingProfile] = useState(false)
  const [usernameError, setUsernameError] = useState(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [activeSession, setActiveSession] = useState(null)
  const [activePack, setActivePack] = useState(null)
  const [invites, setInvites] = useState([])
  const usernameStatus = useUsernameAvailability(nameDraft, profile?.username, user?.uid)

  useEffect(() => {
    if (!user) return
    return subscribeMySessions(user.uid, (sessions) => {
      setActiveSession(sessions.find((s) => s.active !== false) || null)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeMyInvites(user.uid, setInvites)
  }, [user])

  function acceptInvite(invite) {
    dismissInvite(invite.id)
    navigate(`/join/${invite.code}`)
  }

  useEffect(() => {
    if (!activeSession?.packId) {
      setActivePack(null)
      return
    }
    getPackOnce(activeSession.packId).then(setActivePack)
  }, [activeSession?.packId])

  async function handleSaveUsername() {
    setUsernameError(null)
    setSavingUsername(true)
    try {
      await setUsername(nameDraft.trim())
      setEditingProfile(false)
    } catch (err) {
      setUsernameError(err.message === 'taken' ? 'That username is already taken.' : 'Could not save username.')
    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <div className="page">
      <RoadScene signText="ROUTE 66" subText="Side Quest — Next Exit" />
      <h1 className="brand">Side Quest</h1>
      <p className="tagline">Turn any outing into a game.</p>

      <section className="card profile-strip">
        <Avatar uid={user?.uid} name={profile?.username} />
        <div className="profile-strip-info">
          <div className="profile-strip-name">{profile?.username || 'Guest'}</div>
          <div className="profile-strip-sub">{user?.displayName || user?.email}</div>
        </div>
        <button className="ghost" onClick={() => setEditingProfile((v) => !v)}>
          {editingProfile ? 'Close' : 'Edit'}
        </button>
      </section>

      {invites.map((invite) => (
        <section key={invite.id} className="card hero-card">
          <h2>
            <CardIcon icon={Mail} tone="coral" /> Game invite
          </h2>
          <p className="hint">
            {invite.fromName} invited you to {invite.packName ? `a game of ${invite.packName}` : 'a game'} ·
            Code: <strong>{invite.code}</strong>
          </p>
          <div className="row">
            <button className="primary" onClick={() => acceptInvite(invite)}>
              Join game
            </button>
            <button className="ghost" onClick={() => dismissInvite(invite.id)}>
              Dismiss
            </button>
          </div>
        </section>
      ))}

      {activeSession && (
        <section className="card hero-card">
          <h2>
            <CardIcon icon={Dices} tone="pine" /> You&rsquo;re in a game
          </h2>
          <p className="hint">
            {activePack?.emoji} {activePack?.name || 'Game'} · Code: <strong>{activeSession.code}</strong>
          </p>
          <button className="primary" onClick={() => navigate(`/session/${activeSession.code}`)}>
            Rejoin game
          </button>
        </section>
      )}

      {editingProfile && (
        <section className="card">
          <label className="field-label">Your username</label>
          <div className="row">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Enter a username"
              autoFocus
            />
            <button
              onClick={handleSaveUsername}
              disabled={!nameDraft.trim() || savingUsername || usernameStatus === 'taken' || usernameStatus === 'checking'}
            >
              {savingUsername ? 'Saving...' : 'Save'}
            </button>
          </div>
          <UsernameStatus status={usernameStatus} />
          {usernameError && (
            <p className="hint" style={{ color: 'var(--coral-deep)' }}>
              {usernameError}
            </p>
          )}

          <button className="ghost" onClick={signOut}>
            Sign out
          </button>
        </section>
      )}

      <section className="card hero-card">
        <h2>
          <CardIcon icon={Dices} tone="coral" /> Start a new game
        </h2>
        <p className="hint">Pick a pack, set your house rules, and get a link to send your crew.</p>
        <button className="primary" onClick={() => navigate('/create')}>
          Choose a pack &amp; start
        </button>

        <div className="hero-divider">
          <span>or</span>
        </div>

        <label className="field-label">Join a game with a code</label>
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

      <div className="tile-row">
        <button className="quick-tile" onClick={() => navigate('/friends')}>
          <CardIcon icon={Users} tone="mustard" />
          <span>Friends &amp; groups</span>
        </button>
        <button className="quick-tile" onClick={() => navigate('/history')}>
          <CardIcon icon={NotebookText} tone="pine" />
          <span>Game history</span>
        </button>
      </div>
    </div>
  )
}

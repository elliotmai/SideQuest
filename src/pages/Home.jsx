import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoadScene from '../components/RoadScene'
import UsernameStatus from '../components/UsernameStatus'
import Avatar from '../components/Avatar'
import { useUsernameAvailability } from '../lib/useUsernameAvailability'

export default function Home() {
  const { user, profile, setUsername, signInWithGoogle, signOut, signInError } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [nameDraft, setNameDraft] = useState(profile?.username || '')
  const [editingProfile, setEditingProfile] = useState(false)
  const [accountError, setAccountError] = useState(null)
  const [usernameError, setUsernameError] = useState(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [linking, setLinking] = useState(false)
  const usernameStatus = useUsernameAvailability(nameDraft, profile?.username, user?.uid)

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

  const FRIENDLY_ERRORS = {
    'auth/unauthorized-domain':
      "This domain isn't authorized for Google sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.",
    'auth/popup-closed-by-user': null, // user cancelled on purpose, not an error to show
    'auth/network-request-failed': 'Network error — check your connection and try again.',
  }

  function describe(err) {
    if (!err) return null
    if (err.code in FRIENDLY_ERRORS) return FRIENDLY_ERRORS[err.code]
    return `Sign-in failed (${err.code || 'unknown error'}) — ${err.message || 'try again.'}`
  }

  async function handleSignIn() {
    setAccountError(null)
    setLinking(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setAccountError(describe(err))
    } finally {
      setLinking(false)
    }
  }

  const shownError = accountError ?? describe(signInError)

  return (
    <div className="page">
      <RoadScene signText="ROUTE 66" subText="Side Quest — Next Exit" />
      <h1 className="brand">Side Quest</h1>
      <p className="tagline">Turn any outing into a game.</p>

      <section className="card profile-strip">
        <Avatar uid={user?.uid} name={profile?.username} />
        <div className="profile-strip-info">
          <div className="profile-strip-name">{profile?.username || 'Guest'}</div>
          <div className="profile-strip-sub">
            {user?.isAnonymous ? 'Guest — this device only' : user?.displayName || user?.email}
          </div>
        </div>
        <button className="ghost" onClick={() => setEditingProfile((v) => !v)}>
          {editingProfile ? 'Close' : 'Edit'}
        </button>
      </section>

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

          {user?.isAnonymous ? (
            <>
              <p className="hint">
                Create an account to keep your friends and groups if you switch devices or clear your
                browser.
              </p>
              <button onClick={handleSignIn} disabled={linking}>
                {linking ? 'Opening Google sign-in...' : '🔐 Create account with Google'}
              </button>
              {shownError && (
                <p className="hint" style={{ color: 'var(--coral-deep)' }}>
                  {shownError}
                </p>
              )}
            </>
          ) : (
            <button className="ghost" onClick={signOut}>
              Sign out
            </button>
          )}
        </section>
      )}

      <section className="card hero-card">
        <h2>
          <span className="card-icon coral">🎲</span> Start a new game
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
          <span className="card-icon mustard">🧑‍🤝‍🧑</span>
          <span>Friends &amp; groups</span>
        </button>
        <button className="quick-tile" onClick={() => navigate('/history')}>
          <span className="card-icon pine">🗒️</span>
          <span>Game history</span>
        </button>
      </div>
    </div>
  )
}

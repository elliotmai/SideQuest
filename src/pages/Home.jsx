import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoadScene from '../components/RoadScene'

export default function Home() {
  const { user, profile, setUsername, signInWithGoogle, signOut, signInError } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [nameDraft, setNameDraft] = useState(profile?.username || '')
  const [accountError, setAccountError] = useState(null)
  const [linking, setLinking] = useState(false)

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

        {user?.isAnonymous ? (
          <>
            <p className="hint">
              You&rsquo;re playing as a guest — this device only. Create an account to keep your
              friends and groups if you switch devices or clear your browser.
            </p>
            <button onClick={handleSignIn} disabled={linking}>
              {linking ? 'Opening Google sign-in...' : 'Create account with Google'}
            </button>
            {shownError && <p className="hint" style={{ color: 'var(--coral)' }}>{shownError}</p>}
          </>
        ) : (
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="hint">Signed in as {user?.displayName || user?.email}</p>
            <button onClick={signOut}>Sign out</button>
          </div>
        )}
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

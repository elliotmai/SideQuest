import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RoadScene from '../components/RoadScene'
import { describeAuthError } from '../lib/authErrors'

export default function SignIn() {
  const { signInWithGoogle, signInError } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(describeAuthError(err))
    } finally {
      setSigningIn(false)
    }
  }

  const shownError = error ?? describeAuthError(signInError)

  return (
    <div className="page">
      <RoadScene signText="ROUTE 66" subText="Side Quest — Next Exit" />
      <h1 className="brand">Side Quest</h1>
      <p className="tagline">Turn any outing into a game.</p>

      <section className="card hero-card">
        <h2>Sign in to play</h2>
        <p className="hint">
          Everyone needs an account — it&rsquo;s how your friends, groups, and game history stay yours.
        </p>
        <button className="primary" onClick={handleSignIn} disabled={signingIn}>
          <KeyRound size={16} strokeWidth={2.25} style={{ marginRight: '0.35rem', verticalAlign: '-3px' }} />
          {signingIn ? 'Opening Google sign-in...' : 'Continue with Google'}
        </button>
        {shownError && (
          <p className="hint" style={{ color: 'var(--coral-deep)' }}>
            {shownError}
          </p>
        )}
      </section>
    </div>
  )
}

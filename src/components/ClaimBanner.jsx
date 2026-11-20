import { useState } from 'react'
import { claimOldAccount, claimSettled, settleClaim } from '../lib/claimOld'

/* Once, after the move: take back your username, friends and game history. */
export default function ClaimBanner() {
  const [state, setState] = useState(claimSettled() ? 'hidden' : 'offer')
  const [message, setMessage] = useState('')
  if (state === 'hidden') return null
  return (
    <section className="card">
      {state === 'done' ? (
        <>
          <p>{message}</p>
          <button className="primary" onClick={() => window.location.reload()}>Refresh</button>
        </>
      ) : (
        <>
          <h2>Played Side Quest before?</h2>
          <p className="hint">Sign in to your old account once to bring back your username, friends and games.</p>
          {message && <p className="hint" style={{ color: 'var(--coral-deep)' }}>{message}</p>}
          <button className="primary" disabled={state === 'working'} onClick={async () => {
            setState('working'); setMessage('')
            try {
              const n = await claimOldAccount()
              setMessage(n ? 'Welcome back — your games are yours again.' : 'Nothing to bring over for that account.')
              setState('done')
            } catch (e) {
              setMessage(e.message || 'That didn’t work. Try again.')
              setState('offer')
            }
          }}>{state === 'working' ? 'Opening Google…' : 'Use my old Google account'}</button>
          <button onClick={() => { settleClaim(); setState('hidden') }}>I’m new here</button>
        </>
      )}
    </section>
  )
}

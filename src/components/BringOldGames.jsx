import { useState } from 'react'
import { claimOldAccount } from '../lib/claimOld'

/* Quiet, optional: for someone whose earlier games were under a different
   Google account than the one they sign in with now. */
export default function BringOldGames() {
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  async function bringOver() {
    setState('working'); setMessage('')
    try {
      const n = await claimOldAccount()
      setMessage(n ? 'Your old games are here now.' : 'We didn’t find any games for that account.')
      setState('done')
    } catch (e) {
      console.warn('bring old games:', e)
      setMessage('That didn’t work. Try again.')
      setState('idle')
    }
  }

  return (
    <div className="bring-old-games">
      {state === 'done' ? (
        <>
          <p className="hint">{message}</p>
          <button className="ghost" onClick={() => window.location.reload()}>Refresh</button>
        </>
      ) : (
        <>
          <p className="hint">Played before with another Google account?</p>
          {message && <p className="hint" style={{ color: 'var(--coral-deep)' }}>{message}</p>}
          <button className="ghost" disabled={state === 'working'} onClick={bringOver}>
            {state === 'working' ? 'Opening Google…' : 'Bring your old games over'}
          </button>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { checkUsernameAvailability } from './usernames'

// 'idle' | 'checking' | 'available' | 'taken' | 'mine' | 'invalid'
export function useUsernameAvailability(draft, currentUsername, myUid) {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    const trimmed = (draft || '').trim()
    if (!trimmed) {
      setStatus('idle')
      return
    }
    if (trimmed.toLowerCase() === (currentUsername || '').trim().toLowerCase()) {
      setStatus('mine')
      return
    }
    setStatus('checking')
    const handle = setTimeout(async () => {
      try {
        setStatus(await checkUsernameAvailability(trimmed, myUid))
      } catch {
        setStatus('idle')
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [draft, currentUsername, myUid])

  return status
}

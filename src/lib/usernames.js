import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, getDocFreshFirst } from '../firebase'

export function usernameKey(username) {
  return username.trim().toLowerCase()
}

// 'available' | 'mine' | 'taken' | 'invalid'
export async function checkUsernameAvailability(username, myUid) {
  const key = usernameKey(username)
  if (!key) return 'invalid'
  const snap = await getDocFreshFirst(doc(db, 'usernames', key))
  if (!snap.exists()) return 'available'
  return snap.data().uid === myUid ? 'mine' : 'taken'
}

// Atomically claims `username` for `uid` (Firestore security rules only allow
// *creating* a usernames/{key} doc, never overwriting someone else's — see
// firestore.rules — so a racing claim on the same name fails server-side
// instead of silently clobbering the earlier owner). Releases
// `previousUsername`'s claim afterward if it's different. Throws an Error
// with message 'taken' if the name is already claimed by someone else.
export async function claimUsername(username, uid, previousUsername) {
  const key = usernameKey(username)
  const prevKey = previousUsername ? usernameKey(previousUsername) : null
  if (!key || key === prevKey) return

  try {
    await setDoc(doc(db, 'usernames', key), { uid }, { merge: false })
  } catch {
    throw new Error('taken')
  }

  if (prevKey) {
    await deleteDoc(doc(db, 'usernames', prevKey)).catch(() => {})
  }
}

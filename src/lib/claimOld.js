/* ── Your games from before ────────────────────────────────────────────────
   SideQuest's packs, profiles and game history were copied over from Firebase
   (sidequest-42196) as they were, still under each person's old id. Signing
   in to the old account once (Google, as before) lets Hive confirm it's yours;
   then sidequest.claim swaps your old id for your new one everywhere, so your
   username, friends and history are yours again.                          */
import { HIVE_ORIGIN, sidequest, supabase } from '../supabase'

const OLD = {
  apiKey: 'AIzaSyBVrM2DTOeMKT_GeXsM3CtOS0-PXy86Tz4',
  authDomain: 'sidequest-42196.firebaseapp.com',
  projectId: 'sidequest-42196',
  storageBucket: 'sidequest-42196.firebasestorage.app',
  messagingSenderId: '50057783467',
  appId: '1:50057783467:web:bc4f36faa003184f622fee',
}

const DONE_KEY = 'sq_claimed_old'
export const claimSettled = () => {
  try { return localStorage.getItem(DONE_KEY) === '1' } catch { return false }
}
export const settleClaim = () => {
  try { localStorage.setItem(DONE_KEY, '1') } catch { /* private mode */ }
}

/** Google sign-in to the old project, Hive confirms, then claim. Returns records moved. */
export async function claimOldAccount() {
  const [{ initializeApp }, fa] = await Promise.all([import('firebase/app'), import('firebase/auth')])
  const auth = fa.getAuth(initializeApp(OLD, 'sidequest-old'))
  try {
    const { user } = await fa.signInWithPopup(auth, new fa.GoogleAuthProvider())
    const { data: s } = await supabase.auth.getSession()
    const r = await fetch(`${HIVE_ORIGIN}/api/auth/legacy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${s.session?.access_token}` },
      body: JSON.stringify({ app: 'sidequest', idToken: await user.getIdToken() }),
    })
    const said = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(said.error || `Hive answered ${r.status}`)
    const { data, error } = await sidequest.rpc('claim')
    if (error) throw new Error(error.message)
    settleClaim()
    return data || 0
  } finally {
    await fa.signOut(auth).catch(() => {})
  }
}

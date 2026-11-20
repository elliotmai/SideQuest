import { createContext, useContext, useEffect, useState } from 'react'
import { doc, setDoc, serverTimestamp, onSnapshot } from '../lib/store'
import { db, getDocFreshFirst } from '../firebase'
import { supabase } from '../supabase'
import { claimUsername } from '../lib/usernames'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [signInError, setSignInError] = useState(null)

  // Signed in with your Hive account (shared by every app on flyingdoublemranch.com).
  useEffect(() => {
    let lastId = 'unset'
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      const firebaseUser = u ? { uid: u.id, email: u.email || null, displayName: u.user_metadata?.full_name || u.user_metadata?.name || null } : null
      if ((firebaseUser?.uid ?? null) === lastId) return // a token refresh: nothing changed
      lastId = firebaseUser?.uid ?? null
      // Supabase asks not to await other calls inside this callback.
      setTimeout(() => load(firebaseUser), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function load(firebaseUser) {
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(firebaseUser)
      try {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDocFreshFirst(ref)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          let username = localStorage.getItem('sq_username') || `Guest${firebaseUser.uid.slice(0, 4)}`
          try {
            await claimUsername(username, firebaseUser.uid)
          } catch {
            // Someone already has that name — fall back to one namespaced by
            // enough of our own uid that it can't collide with anyone else's.
            username = `Guest${firebaseUser.uid.slice(0, 8)}`
            await claimUsername(username, firebaseUser.uid).catch(() => {})
          }
          const initial = {
            username,
            friends: [],
            groups: [],
            createdAt: serverTimestamp(),
          }
          await setDoc(ref, initial)
          setProfile(initial)
        }
        setAuthError(null)
      } catch (err) {
        // Signed in fine, but couldn't read/create the profile doc (e.g. Firestore rules
        // not deployed yet). Fall back to a local-only profile so the app stays usable.
        console.error('Failed to load profile', err)
        setAuthError(err)
        setProfile({
          username: localStorage.getItem('sq_username') || `Guest${firebaseUser.uid.slice(0, 4)}`,
          friends: [],
          groups: [],
        })
      }
      setLoading(false)
  }


  // Keeps `profile` live after the bootstrap above — otherwise friends added
  // by *you* (which write straight to your own doc, same as anyone else's)
  // and friends added by someone else (who writes straight to your doc)
  // would only ever show up after a full reload.
  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [user])

  async function setUsername(username) {
    const trimmed = username.trim()
    if (!trimmed || !user) return
    await claimUsername(trimmed, user.uid, profile?.username)
    localStorage.setItem('sq_username', trimmed)
    await setDoc(doc(db, 'users', user.uid), { username: trimmed }, { merge: true })
    setProfile((p) => ({ ...p, username: trimmed }))
  }

  // Codes where retrying with a full-page redirect actually has a shot at working
  // (popups blocked, third-party-cookie/browser restrictions, embedded webviews).
  // Anything else (wrong config, unauthorized domain) would just fail the same way.
  async function signInWithGoogle() {
    setSignInError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: 'select_account' } },
    })
    if (error) {
      setSignInError(error)
      throw error
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    setProfile,
    loading,
    authError,
    signInError,
    setUsername,
    signInWithGoogle,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

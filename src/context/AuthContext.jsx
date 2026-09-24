import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  linkWithPopup,
  linkWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [signInError, setSignInError] = useState(null)

  // Catches errors from a signInWithRedirect/linkWithRedirect round trip (the
  // popup fallback below) — onAuthStateChanged alone won't surface these.
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error('Google redirect sign-in failed', err)
      setSignInError(err)
    })
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        try {
          await signInAnonymously(auth)
        } catch (err) {
          console.error('Anonymous sign-in failed', err)
          setAuthError(err)
          setLoading(false)
        }
        return
      }
      setUser(firebaseUser)
      try {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          const initial = {
            username: localStorage.getItem('sq_username') || `Guest${firebaseUser.uid.slice(0, 4)}`,
            isAnonymous: firebaseUser.isAnonymous,
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
          isAnonymous: firebaseUser.isAnonymous,
          friends: [],
          groups: [],
        })
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function setUsername(username) {
    localStorage.setItem('sq_username', username)
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { username }, { merge: true })
      setProfile((p) => ({ ...p, username }))
    }
  }

  // Codes where retrying with a full-page redirect actually has a shot at working
  // (popups blocked, third-party-cookie/browser restrictions, embedded webviews).
  // Anything else (wrong config, unauthorized domain) would just fail the same way.
  const REDIRECT_FALLBACK_CODES = new Set([
    'auth/popup-blocked',
    'auth/operation-not-supported-in-this-environment',
    'auth/web-storage-unsupported',
  ])

  async function signInWithGoogle() {
    setSignInError(null)
    try {
      if (user?.isAnonymous) {
        try {
          const result = await linkWithPopup(auth, googleProvider)
          return result.user
        } catch (err) {
          // Account already exists with these credentials on another user — fall back to plain sign-in.
          if (err.code === 'auth/credential-already-in-use') {
            const result = await signInWithPopup(auth, googleProvider)
            return result.user
          }
          throw err
        }
      }
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (err) {
      if (REDIRECT_FALLBACK_CODES.has(err.code)) {
        // Navigates away — nothing after this runs; getRedirectResult() on the
        // next load (above) picks up the outcome.
        if (user?.isAnonymous) {
          await linkWithRedirect(auth, googleProvider)
        } else {
          await signInWithRedirect(auth, googleProvider)
        }
        return
      }
      setSignInError(err)
      throw err
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
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

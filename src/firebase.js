import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getDoc,
  getDocFromServer,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

// Persistent local cache gives us Firestore's built-in offline queue: writes made
// while offline are cached and automatically replayed once connectivity returns.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// getAuth(app) can end up missing its popup/redirect resolver under some bundler
// tree-shaking setups (surfaces as "Cannot read properties of undefined
// (reading '_popupRedirectResolver')" the moment you call signInWithPopup/
// signInWithRedirect). Wiring it explicitly via initializeAuth avoids that.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
})
export const googleProvider = new GoogleAuthProvider()

// A one-time doc read that always prefers the live server value over the local
// offline cache — used for anything that must be identical across devices
// (profile/username, pack & expansion content). Plain getDoc() can serve a
// stale cached copy on a device that's been offline or backgrounded, which
// looks like data silently disagreeing between devices. Falls back to the
// normal cache-tolerant getDoc() only if the server fetch itself fails (e.g.
// genuinely offline), so the app still works without a connection.
export async function getDocFreshFirst(ref) {
  try {
    return await getDocFromServer(ref)
  } catch {
    return getDoc(ref)
  }
}

import { getDoc, getFirestore } from './lib/store'

/*
 * SideQuest used to live in Firebase. Its data is now in Hive's Supabase
 * project (lib/store.js answers the Firestore calls the app makes) and you
 * sign in with your Hive account (context/AuthContext.jsx). `db` stays so the
 * collection(db, …) calls read as before.
 */
export const db = getFirestore()

// Every read now comes straight from the server, so "fresh first" is just a read.
export const getDocFreshFirst = (ref) => getDoc(ref)

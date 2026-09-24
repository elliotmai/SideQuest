import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

// Short, shareable, human-typeable code (e.g. "7F3K9Q").
function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createSession({ packId, modeId, pointsPerDrink, hostUid, hostName }) {
  const code = generateCode()
  const ref = doc(db, 'sessions', code)
  await setDoc(ref, {
    code,
    packId,
    modeId,
    pointsPerDrink,
    hostUid,
    active: true,
    createdAt: serverTimestamp(),
  })
  await joinSession(code, { uid: hostUid, name: hostName })
  return code
}

export async function getSession(code) {
  const snap = await getDoc(doc(db, 'sessions', code.toUpperCase()))
  return snap.exists() ? snap.data() : null
}

export function subscribeSession(code, cb) {
  return onSnapshot(doc(db, 'sessions', code.toUpperCase()), (snap) => {
    cb(snap.exists() ? snap.data() : null)
  })
}

export async function joinSession(code, { uid, name }) {
  const ref = doc(db, 'sessions', code.toUpperCase(), 'players', uid)
  await setDoc(
    ref,
    { uid, name, score: 0, drinks: 0, joinedAt: serverTimestamp() },
    { merge: true },
  )
}

export function subscribePlayers(code, cb) {
  const q = query(collection(db, 'sessions', code.toUpperCase(), 'players'), orderBy('score', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data()))
  })
}

export function subscribeEvents(code, cb) {
  const q = query(collection(db, 'sessions', code.toUpperCase(), 'events'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function logEvent(code, { uid, name, eventId, eventLabel, points, drinks }) {
  const upperCode = code.toUpperCase()
  await addDoc(collection(db, 'sessions', upperCode, 'events'), {
    uid,
    name,
    eventId,
    eventLabel,
    points,
    drinks,
    timestamp: serverTimestamp(),
  })
  await updateDoc(doc(db, 'sessions', upperCode, 'players', uid), {
    score: increment(points),
    drinks: increment(drinks),
  })
}

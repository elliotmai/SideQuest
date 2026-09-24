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

export async function createSession({ packId, expansionIds = [], modifierIds = [], hostUid, hostName }) {
  const code = generateCode()
  const ref = doc(db, 'sessions', code)
  await setDoc(ref, {
    code,
    packId,
    expansionIds,
    modifierIds,
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
    { uid, name, score: 0, drinkUnits: 0, pendingMultiplier: 1, joinedAt: serverTimestamp() },
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

// `drink`/`points` are already fully resolved (mode modifiers + any consumed
// multiplier applied) by the caller — see data/modes.js#resolveDrink.
// `deck`, if given, is { hand, stock, discard } after playCard() — persisted
// in the same write as the score so a page refresh mid-animation can't lose
// or duplicate a card.
export async function logEvent(code, { uid, name, eventId, eventLabel, drink, points, deck }) {
  const upperCode = code.toUpperCase()
  await addDoc(collection(db, 'sessions', upperCode, 'events'), {
    uid,
    name,
    eventId,
    eventLabel,
    drink,
    points,
    timestamp: serverTimestamp(),
  })
  await updateDoc(doc(db, 'sessions', upperCode, 'players', uid), {
    score: increment(points),
    drinkUnits: increment(drink.amount),
    pendingMultiplier: 1,
    ...(deck ? { hand: deck.hand, stock: deck.stock, discard: deck.discard } : {}),
  })
}

// Arms a multiplier card for the tapping player's *next* scored event only.
export async function armMultiplier(code, { uid, name, eventId, eventLabel, factor, deck }) {
  const upperCode = code.toUpperCase()
  await addDoc(collection(db, 'sessions', upperCode, 'events'), {
    uid,
    name,
    eventId,
    eventLabel,
    multiplierArmed: factor,
    timestamp: serverTimestamp(),
  })
  await updateDoc(doc(db, 'sessions', upperCode, 'players', uid), {
    pendingMultiplier: factor,
    ...(deck ? { hand: deck.hand, stock: deck.stock, discard: deck.discard } : {}),
  })
}

// Deals a player's personal hand/stock/discard piles for this session, once.
export async function dealPlayerDeck(code, uid, { hand, stock, discard }) {
  await updateDoc(doc(db, 'sessions', code.toUpperCase(), 'players', uid), { hand, stock, discard })
}

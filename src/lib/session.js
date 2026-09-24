import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

// Local-date (not UTC) "YYYY-MM-DD" — a session played late at night should
// still land on the day the player thinks of it as, not shift with UTC.
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
    notes: '',
    participantUids: [hostUid],
    datesPlayed: [todayKey()],
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

// Idempotent: rejoining a session you're already in (e.g. the auto-join
// effect firing before the players snapshot has loaded, or reopening an
// invite link) must never stomp an existing score/hand back to zero.
export async function joinSession(code, { uid, name }) {
  const upperCode = code.toUpperCase()
  const ref = doc(db, 'sessions', upperCode, 'players', uid)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    await setDoc(ref, { uid, name }, { merge: true })
  } else {
    await setDoc(ref, { uid, name, score: 0, drinkUnits: 0, pendingMultiplier: 1, joinedAt: serverTimestamp() })
  }
  await updateDoc(doc(db, 'sessions', upperCode), {
    participantUids: arrayUnion(uid),
    datesPlayed: arrayUnion(todayKey()),
  })
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

export async function endSession(code) {
  await updateDoc(doc(db, 'sessions', code.toUpperCase()), { active: false, endedAt: serverTimestamp() })
}

// Reopens an ended session and logs today as another day it was played.
export async function resumeSession(code) {
  await updateDoc(doc(db, 'sessions', code.toUpperCase()), {
    active: true,
    endedAt: null,
    datesPlayed: arrayUnion(todayKey()),
  })
}

export async function updateSessionNotes(code, notes) {
  await updateDoc(doc(db, 'sessions', code.toUpperCase()), { notes })
}

// Every session this player has ever joined, newest-created first. Sorted
// client-side (rather than an `orderBy` in the query) so this only needs the
// automatic single-field index Firestore gives `array-contains` for free.
export function subscribeMySessions(uid, cb) {
  const q = query(collection(db, 'sessions'), where('participantUids', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map((d) => d.data())
    sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    cb(sessions)
  })
}

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
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'
import { drawCards, playSharedCard } from './cardGame'

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

// `stock` is the session's one shared, pre-shuffled deck (built once by the
// host from the chosen pack + expansions — see CreateSession.jsx) that every
// player's hand is dealt from and every played card is discarded back into,
// rather than each player holding their own independent copy of the deck.
export async function createSession({ packId, expansionIds = [], modifierIds = [], hostUid, hostName, stock = [] }) {
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
    stock,
    discard: [],
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
// multiplier applied) by the caller — see data/modes.js#resolveDrink. The
// played card's hand/stock/discard bookkeeping is handled separately by
// playSharedCard() below, since it has to happen in the same transaction as
// everyone else's draws from the shared deck.
export async function logEvent(code, { uid, name, eventId, eventLabel, drink, points }) {
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
  })
}

// Arms a multiplier card for the tapping player's *next* scored event only.
export async function armMultiplier(code, { uid, name, eventId, eventLabel, factor }) {
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
  })
}

// Deals a player's hand by drawing `handSize` cards off the session's one
// shared stock pile (reshuffling the shared discard back in if it runs dry).
// Runs as a transaction so two players joining at once can't both be dealt
// the same card off the top of the pile. Idempotent: if this player already
// has a hand (e.g. the effect that calls this fires twice), it's returned
// as-is rather than dealing a second one.
export async function dealPlayerHand(code, uid, handSize = 5) {
  const upperCode = code.toUpperCase()
  const sessionRef = doc(db, 'sessions', upperCode)
  const playerRef = doc(db, 'sessions', upperCode, 'players', uid)
  return runTransaction(db, async (tx) => {
    const [sessionSnap, playerSnap] = await Promise.all([tx.get(sessionRef), tx.get(playerRef)])
    const existingHand = playerSnap.data()?.hand
    if (existingHand) return existingHand

    const session = sessionSnap.data()
    const { drawn, stock, discard } = drawCards(session.stock || [], session.discard || [], handSize)
    tx.update(sessionRef, { stock, discard })
    tx.update(playerRef, { hand: drawn })
    return drawn
  })
}

// Plays the card at `index` out of this player's hand: discards it onto the
// shared pile and draws its replacement from the same shared stock, all in
// one transaction so two players can't both draw the card currently on top.
// Returns { hand, playedCard, drawnCard } — see cardGame.js#playSharedCard.
export async function playSessionCard(code, uid, index) {
  const upperCode = code.toUpperCase()
  const sessionRef = doc(db, 'sessions', upperCode)
  const playerRef = doc(db, 'sessions', upperCode, 'players', uid)
  return runTransaction(db, async (tx) => {
    const [sessionSnap, playerSnap] = await Promise.all([tx.get(sessionRef), tx.get(playerRef)])
    const session = sessionSnap.data()
    const hand = playerSnap.data()?.hand || []
    const result = playSharedCard(hand, session.stock || [], session.discard || [], index)
    tx.update(sessionRef, { stock: result.stock, discard: result.discard })
    tx.update(playerRef, { hand: result.hand })
    return result
  })
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

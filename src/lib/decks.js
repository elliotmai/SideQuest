import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_PACKS } from '../data/defaultPacks'
import { DEFAULT_EXPANSIONS } from '../data/defaultExpansions'

export function subscribePacks(cb) {
  const q = query(collection(db, 'packs'), orderBy('name'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export function subscribeExpansions(cb) {
  const q = query(collection(db, 'expansions'), orderBy('name'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function getPackOnce(id) {
  const snap = await getDoc(doc(db, 'packs', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getExpansionOnce(id) {
  const snap = await getDoc(doc(db, 'expansions', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function savePack(pack) {
  await setDoc(doc(db, 'packs', pack.id), pack, { merge: false })
}

export async function deletePack(id) {
  await deleteDoc(doc(db, 'packs', id))
}

export async function saveExpansion(expansion) {
  await setDoc(doc(db, 'expansions', expansion.id), expansion, { merge: false })
}

export async function deleteExpansion(id) {
  await deleteDoc(doc(db, 'expansions', id))
}

// Idempotent: (re)writes the built-in packs/expansions into Firestore so admins
// have something to start editing from, and so a fresh Firebase project isn't empty.
export async function seedDefaults() {
  await Promise.all([
    ...DEFAULT_PACKS.map((p) => savePack(p)),
    ...DEFAULT_EXPANSIONS.map((e) => saveExpansion(e)),
  ])
}

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

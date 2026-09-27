import { collection, doc, deleteDoc, query, where, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// Sends one invite doc per invited friend so each side can see/dismiss their
// own copy independently. Batched so a partial send (some friends invited,
// some not) can't happen on a mid-flight failure.
export async function sendInvites(code, { fromUid, fromName, packName, toUids }) {
  const batch = writeBatch(db)
  toUids.forEach((toUid) => {
    const ref = doc(collection(db, 'invites'))
    batch.set(ref, {
      code,
      fromUid,
      fromName,
      packName: packName || null,
      toUid,
      createdAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

// Sorted client-side (rather than an `orderBy` in the query) so this only
// needs the automatic single-field index Firestore gives an equality filter
// for free — same reasoning as subscribeMySessions in lib/session.js.
export function subscribeMyInvites(uid, cb) {
  const q = query(collection(db, 'invites'), where('toUid', '==', uid))
  return onSnapshot(q, (snap) => {
    const invites = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    invites.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    cb(invites)
  })
}

export async function dismissInvite(inviteId) {
  await deleteDoc(doc(db, 'invites', inviteId))
}

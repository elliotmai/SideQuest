import {
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'

export async function findUserByUsername(username) {
  const q = query(collection(db, 'users'), where('username', '==', username))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { uid: d.id, ...d.data() }
}

export async function addFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayUnion(friendUid) })
  await updateDoc(doc(db, 'users', friendUid), { friends: arrayUnion(myUid) })
}

export async function removeFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayRemove(friendUid) })
  await updateDoc(doc(db, 'users', friendUid), { friends: arrayRemove(myUid) })
}

export async function createGroup(ownerUid, name, memberUids = []) {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    ownerUid,
    members: [ownerUid, ...memberUids],
    createdAt: Date.now(),
  })
  return ref.id
}

export function subscribeMyGroups(uid, cb) {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

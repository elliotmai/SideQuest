import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
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

export async function getUsersByIds(uids) {
  const unique = [...new Set(uids)]
  const snaps = await Promise.all(unique.map((uid) => getDoc(doc(db, 'users', uid))))
  return snaps.filter((s) => s.exists()).map((s) => ({ uid: s.id, ...s.data() }))
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

// Replaces a group's member list outright (the owner plus whichever friends
// they picked) — lets one person keep several distinct crews (football
// friends, beach crew, a partner-only group, ...) instead of one big list.
export async function updateGroupMembers(groupId, ownerUid, memberUids) {
  await updateDoc(doc(db, 'groups', groupId), {
    members: [ownerUid, ...memberUids.filter((id) => id !== ownerUid)],
  })
}

export async function renameGroup(groupId, name) {
  await updateDoc(doc(db, 'groups', groupId), { name })
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'groups', groupId))
}

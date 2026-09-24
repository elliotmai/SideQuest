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
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { usernameKey } from './usernames'

// Looks the name up in the `usernames/{lowercasedKey}` collection (the same
// one username-uniqueness claims live in) rather than querying `users` by
// its `username` field directly — that field keeps its original casing, so
// an exact-match query silently misses anything typed in different case.
export async function findUserByUsername(username) {
  const key = usernameKey(username)
  if (!key) return null
  const claimSnap = await getDoc(doc(db, 'usernames', key))
  if (!claimSnap.exists()) return null
  const userSnap = await getDoc(doc(db, 'users', claimSnap.data().uid))
  if (!userSnap.exists()) return null
  return { uid: userSnap.id, ...userSnap.data() }
}

export async function getUsersByIds(uids) {
  const unique = [...new Set(uids)]
  const snaps = await Promise.all(unique.map((uid) => getDoc(doc(db, 'users', uid))))
  return snaps.filter((s) => s.exists()).map((s) => ({ uid: s.id, ...s.data() }))
}

// One-directional by design: Firestore rules only let a user write their own
// profile doc (see firestore.rules), so this can't also update the other
// person's `friends` array — that write would be rejected server-side.
// "Friends" here really means "people I can quickly add to a group", which
// only needs to live on the adder's own doc.
export async function addFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayUnion(friendUid) })
}

export async function removeFriend(myUid, friendUid) {
  await updateDoc(doc(db, 'users', myUid), { friends: arrayRemove(friendUid) })
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

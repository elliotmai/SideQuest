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
  writeBatch,
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

// Bidirectional: adding a friend adds each of you to the other's list.
// firestore.rules carries a narrow rule letting someone add/remove only
// their own uid on someone else's `friends` array (nothing else) — that's
// what makes the second write here legal. Batched so the two writes commit
// or fail together — a half-applied friendship (one side has it, the other
// doesn't) would otherwise be a real possibility on any mid-flight failure.
export async function addFriend(myUid, friendUid) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', myUid), { friends: arrayUnion(friendUid) })
  batch.update(doc(db, 'users', friendUid), { friends: arrayUnion(myUid) })
  await batch.commit()
}

export async function removeFriend(myUid, friendUid) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', myUid), { friends: arrayRemove(friendUid) })
  batch.update(doc(db, 'users', friendUid), { friends: arrayRemove(myUid) })
  await batch.commit()
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

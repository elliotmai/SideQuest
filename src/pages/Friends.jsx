import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  findUserByUsername,
  addFriend,
  getUsersByIds,
  createGroup,
  updateGroupMembers,
  deleteGroup,
  subscribeMyGroups,
} from '../lib/friends'
import { useNavigate } from 'react-router-dom'

function FriendCheckboxList({ friends, selected, onToggle }) {
  if (friends.length === 0) {
    return <p className="hint">Add some friends above first.</p>
  }
  return (
    <div className="mode-list">
      {friends.map((f) => (
        <label key={f.uid} className={`mode-row ${selected.includes(f.uid) ? 'selected' : ''}`}>
          <input type="checkbox" checked={selected.includes(f.uid)} onChange={() => onToggle(f.uid)} />
          <div className="mode-name">{f.username}</div>
        </label>
      ))}
    </div>
  )
}

function GroupCard({ group, friends, ownerUid, onUpdateMembers, onDelete, onQuickStart }) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(group.members.filter((id) => id !== ownerUid))

  function toggle(uid) {
    setSelected((ids) => (ids.includes(uid) ? ids.filter((id) => id !== uid) : [...ids, uid]))
  }

  const memberNames = friends
    .filter((f) => group.members.includes(f.uid))
    .map((f) => f.username)

  return (
    <div className="card" style={{ gap: '0.5rem' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>{group.name}</span>
        <div className="row">
          <button onClick={onQuickStart}>Quick start</button>
          <button onClick={() => onDelete(group.id)}>Delete</button>
        </div>
      </div>
      <p className="hint">{memberNames.length ? memberNames.join(', ') : 'Just you so far'}</p>

      {editing ? (
        <>
          <FriendCheckboxList friends={friends} selected={selected} onToggle={toggle} />
          <div className="row">
            <button
              className="primary"
              onClick={() => {
                onUpdateMembers(group.id, selected)
                setEditing(false)
              }}
            >
              Save members
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <button onClick={() => setEditing(true)}>Edit members</button>
      )}
    </div>
  )
}

export default function Friends() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchName, setSearchName] = useState('')
  const [status, setStatus] = useState('')
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMembers, setNewGroupMembers] = useState([])
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeMyGroups(user.uid, setGroups)
  }, [user])

  useEffect(() => {
    getUsersByIds(profile?.friends || []).then(setFriends)
  }, [profile?.friends])

  async function handleAddFriend() {
    setStatus('Searching...')
    const found = await findUserByUsername(searchName.trim())
    if (!found) {
      setStatus('No user found with that username.')
      return
    }
    if (found.uid === user.uid) {
      setStatus("That's you!")
      return
    }
    await addFriend(user.uid, found.uid)
    setStatus(`Added ${found.username} as a friend.`)
    setSearchName('')
  }

  function toggleNewGroupMember(uid) {
    setNewGroupMembers((ids) => (ids.includes(uid) ? ids.filter((id) => id !== uid) : [...ids, uid]))
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    setCreatingGroup(true)
    try {
      await createGroup(user.uid, newGroupName.trim(), newGroupMembers)
      setNewGroupName('')
      setNewGroupMembers([])
    } finally {
      setCreatingGroup(false)
    }
  }

  function quickStart() {
    // Group members already have the app; "quick start" just skips re-typing who's
    // playing and jumps straight to picking a pack for this crew.
    navigate('/create')
  }

  return (
    <div className="page">
      <h1>Friends &amp; groups</h1>

      <section className="card">
        <h2><span className="card-icon coral">🤝</span> Add a friend</h2>
        <div className="row">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Their username"
          />
          <button onClick={handleAddFriend} disabled={!searchName.trim()}>
            Add
          </button>
        </div>
        {status && <p className="hint">{status}</p>}
        <p className="hint">You have {friends.length} friend(s).</p>
      </section>

      <section className="card">
        <h2><span className="card-icon mustard">👥</span> New group</h2>
        <div className="row">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name (e.g. Beach Crew)"
          />
        </div>
        <p className="hint">Pick who&rsquo;s in this one — you can have as many groups as you like.</p>
        <FriendCheckboxList friends={friends} selected={newGroupMembers} onToggle={toggleNewGroupMember} />
        <button
          className="primary"
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim() || creatingGroup}
        >
          {creatingGroup ? 'Creating...' : 'Create group'}
        </button>
      </section>

      {groups.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              friends={friends}
              ownerUid={user.uid}
              onUpdateMembers={(groupId, memberUids) => updateGroupMembers(groupId, user.uid, memberUids)}
              onDelete={deleteGroup}
              onQuickStart={quickStart}
            />
          ))}
        </section>
      )}
    </div>
  )
}

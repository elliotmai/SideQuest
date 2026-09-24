import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { findUserByUsername, addFriend, createGroup, subscribeMyGroups } from '../lib/friends'
import { useNavigate } from 'react-router-dom'

export default function Friends() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchName, setSearchName] = useState('')
  const [status, setStatus] = useState('')
  const [groups, setGroups] = useState([])
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    if (!user) return
    return subscribeMyGroups(user.uid, setGroups)
  }, [user])

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

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    await createGroup(user.uid, newGroupName.trim(), profile?.friends || [])
    setNewGroupName('')
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
        <h2>Add a friend</h2>
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
        <p className="hint">You have {(profile?.friends || []).length} friend(s).</p>
      </section>

      <section className="card">
        <h2>Persistent groups</h2>
        <div className="row">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name (e.g. Beach Crew)"
          />
          <button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
            Create
          </button>
        </div>
        <p className="hint">New groups start with your current friends list.</p>

        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.id}>
              <span>
                {g.name} ({g.members.length} members)
              </span>
              <button onClick={quickStart}>Quick start game</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

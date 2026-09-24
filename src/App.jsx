import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import CreateSession from './pages/CreateSession'
import JoinSession from './pages/JoinSession'
import SessionView from './pages/SessionView'
import Friends from './pages/Friends'
import './App.css'

function Shell({ children }) {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="page">
        <p>Loading Side Quest...</p>
      </div>
    )
  }
  return (
    <>
      <nav className="topnav">
        <Link to="/" className="topnav-brand">
          Side Quest
        </Link>
      </nav>
      {children}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateSession />} />
            <Route path="/join/:code" element={<JoinSession />} />
            <Route path="/session/:code" element={<SessionView />} />
            <Route path="/friends" element={<Friends />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  )
}

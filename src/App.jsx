import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, Dices, NotebookText, Users } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import CreateSession from './pages/CreateSession'
import JoinSession from './pages/JoinSession'
import SessionView from './pages/SessionView'
import Friends from './pages/Friends'
import History from './pages/History'
import Admin from './pages/Admin'
import Print from './pages/Print'
import RoadBackdrop from './components/RoadBackdrop'
import Loading from './components/Loading'
import './App.css'

function Shell({ children }) {
  const { loading, user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Prefer the actual previous page (browser back); only fall back to Home
  // when there's no in-app history to go back to (e.g. a shared link opened
  // straight into a session).
  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }
  if (loading) {
    return (
      <div className="page">
        <h1 className="brand">Side Quest</h1>
        <Loading label="Getting things ready..." />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="page">
        <h1 className="brand">Side Quest</h1>
        <p>
          Couldn&rsquo;t connect. Check your internet connection and reload the page.
        </p>
        <button className="primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }
  const isPrint = location.pathname.startsWith('/print')

  return (
    <>
      <nav className="topnav">
        {location.pathname !== '/' && (
          <button type="button" onClick={goBack} className="topnav-home-link">
            &larr; Back
          </button>
        )}
        <Link to="/" className="topnav-brand">
          Side Quest
        </Link>
        {profile?.isAdmin && (
          <Link to="/admin" className="topnav-admin-link">
            Admin
          </Link>
        )}
      </nav>
      {children}
      {!isPrint && (
        <nav className="bottom-nav no-print">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <HomeIcon className="bottom-nav-icon" size={19} strokeWidth={2.25} />
            <span>Home</span>
          </Link>
          <Link
            to="/create"
            className={`bottom-nav-item ${location.pathname.startsWith('/create') ? 'active' : ''}`}
          >
            <Dices className="bottom-nav-icon" size={19} strokeWidth={2.25} />
            <span>Play</span>
          </Link>
          <Link
            to="/history"
            className={`bottom-nav-item ${location.pathname.startsWith('/history') ? 'active' : ''}`}
          >
            <NotebookText className="bottom-nav-icon" size={19} strokeWidth={2.25} />
            <span>History</span>
          </Link>
          <Link
            to="/friends"
            className={`bottom-nav-item ${location.pathname.startsWith('/friends') ? 'active' : ''}`}
          >
            <Users className="bottom-nav-icon" size={19} strokeWidth={2.25} />
            <span>Friends</span>
          </Link>
        </nav>
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RoadBackdrop />
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateSession />} />
            <Route path="/join/:code" element={<JoinSession />} />
            <Route path="/session/:code" element={<SessionView />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/print/:kind/:id" element={<Print />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  )
}

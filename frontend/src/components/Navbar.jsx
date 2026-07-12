import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import api from '../api/client'
import { useStreak } from '../hooks/useStreak'
import { getXpDetails } from '../utils/ranks'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/tasks', label: 'Tasks', icon: '🎯' },
  { to: '/courses', label: 'Lessons', icon: '📚' },
  { to: '/playground', label: 'Playground', icon: '⚡' },
  { to: '/submissions', label: 'Submissions', icon: '📝' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/achievements', label: 'Achievements', icon: '🎖️' },
  { to: '/about', label: 'About', icon: '💬' },
]

export default function Navbar() {
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const isExamMode = useStore(s => s.isExamMode)
  const { theme, toggleTheme } = useStore(s => ({ theme: s.theme, toggleTheme: s.toggleTheme }))
  const location = useLocation()
  const { streakData } = useStreak()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [userXp, setUserXp] = useState(0)
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  const logout = () => {
    api.post('/auth/logout').finally(() => { setUser(null); window.location.href = '/' })
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (user) {
      api.get('/user/notifications').then(res => setNotifications(res.data.notifications)).catch(console.error)
      api.get('/user/xp').then(res => setUserXp(res.data.totalXp)).catch(console.error)
    }
  }, [user])

  const handleNotifClick = () => {
    setNotifDropdownOpen(o => !o)
    setDropdownOpen(false)
    if (!notifDropdownOpen) {
      const hasUnread = notifications.some(n => !n.readAt)
      if (hasUnread) {
        api.post('/user/notifications/read', {}).then(() => {
          setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
        }).catch(console.error)
      }
    }
  }

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase()

  return (
    <>
      <header className={`z-40 w-full transition-all duration-300 ${isExamMode
          ? 'fixed top-0 left-0 right-0 h-4 overflow-hidden opacity-0 hover:h-[72px] hover:opacity-100 hover:bg-[#030712]/95 border-b border-transparent hover:border-white/10 z-[100] backdrop-blur-md'
          : 'sticky top-0'
        }`}>
        {/* Glass bar */}
        <div className="glass-nav mx-auto flex w-full items-center justify-between px-4 md:px-6 py-3 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img src="/images/logo.png" alt="Programmer Learner Logo" className="h-10 w-10 object-cover rounded-full shadow-lg transition-shadow group-hover:shadow-cyan-500/30 ring-2 ring-cyan-500/50" />
            <div className="hidden sm:block">
              <span className="block font-bold text-white text-sm leading-tight tracking-tight">Programmer Learner</span>
              <span className="block text-[10px] font-semibold text-cyan-500 leading-tight">Secure Platform</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(to)
                    ? 'bg-cyan-500/12 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link to="/admin"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/admin')
                    ? 'bg-violet-500/12 text-violet-400'
                    : 'text-slate-400 hover:text-violet-400 hover:bg-violet-500/5'
                  }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center gap-2">
            {user && user.role !== 'ADMIN' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 mr-1 cursor-default">
                <span className={`text-[11px] font-black ${getXpDetails(userXp).rankColor}`}>Lvl {getXpDetails(userXp).level}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-xs font-bold text-amber-400">⚡{userXp}</span>
              </div>
            )}
            {user && streakData && streakData.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-bold border border-orange-500/20 mr-1" title="Daily Streak">
                🔥 {streakData.currentStreak}
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleNotifClick}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm relative"
                  title="Notifications"
                >
                  🔔
                  {notifications.some(n => !n.readAt) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  )}
                </button>
                {notifDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto rounded-2xl animate-scale-in"
                    style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 50 }}
                  >
                    <div className="px-4 py-3 border-b sticky top-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-overlay)', zIndex: 10 }}>
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                    </div>
                    <div className="py-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 hover:bg-white/5 transition-colors border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                            <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.body}</p>

                            <p className="text-[10px] text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              /* Avatar Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setDropdownOpen(o => !o)
                    setNotifDropdownOpen(false)
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <img
                    src={user.avatarUrl || "/images/pravin-photo.jpg"}
                    alt="Profile"
                    className="flex h-8 w-8 items-center justify-center rounded-full object-cover flex-shrink-0 transition-shadow group-hover:shadow-cyan-500/30 ring-2 ring-cyan-500/30"
                  />
                  <span className="text-sm text-slate-300 max-w-[100px] truncate hidden lg:block">
                    {user.name || user.email}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden animate-scale-in"
                    style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <p className="text-xs font-semibold text-white truncate">{user.name || 'Student'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      {user.role === 'ADMIN' && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 uppercase tracking-wider">Admin</span>
                      )}
                    </div>
                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <span className="text-base">🏠</span> Dashboard
                      </Link>
                      <Link to="/settings" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <span className="text-base">⚙️</span> Settings
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/5 transition-colors">
                          <span className="text-base">🛡️</span> Admin Panel
                        </Link>
                      )}
                      {user?.role === 'TEACHER' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/5 transition-colors">
                          <span className="text-base">👩‍🏫</span> Teacher Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t py-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <button onClick={logout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                        <span className="text-base">🚪</span> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="btn-primary text-sm px-4 py-2"
                style={{ borderRadius: '10px' }}
              >
                Get started →
              </Link>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-current mb-1.5 transition-all duration-300" style={menuOpen ? { transform: 'rotate(45deg) translate(2px,6px)' } : {}} />
            <span className="block w-5 h-0.5 bg-current mb-1.5 transition-all duration-300" style={menuOpen ? { opacity: 0, width: 0 } : {}} />
            <span className="block w-5 h-0.5 bg-current transition-all duration-300" style={menuOpen ? { transform: 'rotate(-45deg) translate(2px,-6px)' } : {}} />
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMenuOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 h-full w-72 z-40 md:hidden flex flex-col transition-transform duration-300"
        style={{
          background: 'var(--bg-overlay)',
          borderLeft: '1px solid var(--border-default)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: menuOpen ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>PL</span>
            <span className="text-sm font-bold text-white">Menu</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(to) ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-base w-6 text-center">{icon}</span>
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link to="/admin"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-violet-500/10 text-violet-400' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-base w-6 text-center">🛡️</span>
              Admin Panel
            </Link>
          )}
          {user?.role === 'TEACHER' && (
            <Link to="/admin"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-base w-6 text-center">👩‍🏫</span> Teacher Dashboard
            </Link>
          )}
        </nav>

        {/* Drawer footer */}
        <div className="border-t px-4 py-4 space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            <span className="text-base w-6 text-center">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          {user ? (
            <>
              <Link to="/settings"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                <span className="text-base w-6 text-center">⚙️</span> Settings
              </Link>
              <button onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                <span className="text-base w-6 text-center">🚪</span> Sign out
              </button>
            </>
          ) : (
            <Link to="/login"
              className="btn-primary w-full text-center">
              Get started →
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

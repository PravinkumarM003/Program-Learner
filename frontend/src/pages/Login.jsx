import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Login() {
  const navigate = useNavigate()
  const setUser = useStore(s => s.setUser)
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  return (
    <div className="min-h-[calc(100vh-60px)] flex items-stretch">
      
      {/* ── LEFT: Brand Panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #080d1a 0%, #0d1a30 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>PL</span>
          <div>
            <span className="block text-white font-bold text-sm leading-tight">Programmer Learner</span>
            <span className="block text-[10px] text-cyan-500 font-semibold leading-tight">Secure Platform</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 animate-fade-up">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Level up your<br />
            <span className="gradient-text">programming skills</span>
          </h2>
          <p className="text-base text-slate-400 leading-relaxed max-w-sm">
            A professional coding platform with live code execution, instructor reviews, 
            XP gamification, and a real-time leaderboard.
          </p>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-3">
            {[
              { icon: '⚡', text: 'Monaco code editor with Python & C support' },
              { icon: '🏆', text: 'XP rewards and live leaderboard ranking' },
              { icon: '🔐', text: 'Enterprise-grade security — Google OAuth' },
              { icon: '📊', text: 'Progress tracking across lessons and tasks' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 glass-card rounded-2xl p-4">
          <p className="text-sm text-slate-300 italic leading-relaxed">
            "The best way to learn programming is to write programs."
          </p>
          <p className="text-xs text-slate-500 mt-2">— Dennis Ritchie</p>
        </div>
      </div>

      {/* ── RIGHT: Auth Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>PL</span>
            <span className="text-lg font-bold text-white">Programmer Learner</span>
          </div>

          {/* Card */}
          <div className="glass-card rounded-3xl p-8 text-center" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-black text-white">Welcome back</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Sign in to continue your programming journey
              </p>
            </div>

            {/* Local auth form (register/login) */}
            <div className="mb-4 flex gap-2 justify-center">
              <button onClick={() => setMode('login')} className={`px-4 py-2 rounded-xl ${mode==='login'?'bg-white text-slate-900':'text-white/60'}`}>Sign in</button>
              <button onClick={() => setMode('register')} className={`px-4 py-2 rounded-xl ${mode==='register'?'bg-white text-slate-900':'text-white/60'}`}>Create account</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault(); setError('')
              if (!username || !password) { setError('Username and password required'); return }
              // simple client-side SHA-256 password hashing
              const enc = new TextEncoder();
              const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(password));
              const hash = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('')

              const raw = localStorage.getItem('local_users')
              const users = raw ? JSON.parse(raw) : {}

              if (mode === 'register') {
                if (!email) { setError('Email required for new accounts'); return }
                if (users[username]) { setError('Username already exists'); return }
                users[username] = { username, email, passwordHash: hash }
                localStorage.setItem('local_users', JSON.stringify(users))
                setUser({ id: `local-${username}`, email, name: username, role: 'STUDENT' })
                navigate('/dashboard')
              } else {
                const u = users[username]
                if (!u || u.passwordHash !== hash) { setError('Invalid username or password'); return }
                setUser({ id: `local-${username}`, email: u.email, name: username, role: 'STUDENT' })
                navigate('/dashboard')
              }
            }}>
              <div className="space-y-3 text-left">
                <label className="text-xs text-slate-400">Username</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded-lg px-3 py-2" placeholder="username" />

                <label className="text-xs text-slate-400">Password</label>
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full rounded-lg px-3 py-2" placeholder="password" />

                {mode==='register' && (
                  <>
                    <label className="text-xs text-slate-400">Email (Gmail recommended)</label>
                    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full rounded-lg px-3 py-2" placeholder="you@gmail.com" />
                  </>
                )}

                {error && <div className="text-sm text-red-400">{error}</div>}

                <button type="submit" className="w-full rounded-2xl px-6 py-3.5 font-semibold text-slate-900" style={{ background: '#ffffff' }}>
                  {mode==='register' ? 'Create account' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>secure & encrypted</span>
              <span className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '🔒', label: 'CSRF Protected' },
                { icon: '🍪', label: 'HTTP-only Cookies' },
                { icon: '🛡️', label: 'Rate Limited' },
              ].map(({ icon, label }) => (
                <div key={label} className="rounded-xl p-2.5 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-base">{icon}</span>
                  <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              By signing in you agree to our Terms and Privacy Policy.
            </p>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            New to Programmer Learner? Your account is created automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

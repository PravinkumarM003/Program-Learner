import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://program-learner.onrender.com/api'

export default function Login() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleGoogleLogin = () => {
    const authUrl = BASE_URL.replace(/\/api$/, '') + '/api/auth/google'
    window.location.href = authUrl
  }

  const handleDevLogin = () => {
    const authUrl = BASE_URL.replace(/\/api$/, '') + '/api/auth/dev-login'
    window.location.href = authUrl
  }

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

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full rounded-2xl px-6 py-4 font-bold text-slate-900 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
                style={{ background: '#ffffff', boxShadow: '0 4px 14px rgba(255,255,255,0.2)' }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              {import.meta.env.DEV && (
                <button
                  onClick={handleDevLogin}
                  className="w-full rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-3 transition-colors"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  🛠️ Developer Auto-Login
                </button>
              )}
            </div>

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

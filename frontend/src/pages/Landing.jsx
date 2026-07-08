import { Link, Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

const FEATURES = [
  {
    icon: '💻',
    title: 'C & Python Courses',
    desc: 'Separate structured learning paths for C and Python — from beginner to advanced, with lessons, quizzes, and tasks.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    accent: '#06b6d4',
  },
  {
    icon: '🔥',
    title: 'Daily Challenges',
    desc: 'A new coding challenge every day. Solve it to climb the leaderboard and earn bonus XP before time runs out.',
    color: 'from-orange-500/20 to-orange-500/5',
    accent: '#f97316',
  },
  {
    icon: '🏆',
    title: 'Levels, Ranks & Leaderboard',
    desc: 'Earn XP to level up from Bronze to Grandmaster. Compete on a live leaderboard to see where you stand.',
    color: 'from-amber-500/20 to-amber-500/5',
    accent: '#f59e0b',
  },
  {
    icon: '🤖',
    title: 'AI Hints & Live Code Editor',
    desc: 'Monaco-powered IDE with real-time compilation. Spend XP to unlock AI hints when you get stuck.',
    color: 'from-violet-500/20 to-violet-500/5',
    accent: '#8b5cf6',
  },
  {
    icon: '🔐',
    title: 'Anti-Cheat & Exam Mode',
    desc: 'Copy-paste detection, IP-based auto-ban, and a lockdown exam mode that hides the navbar during timed tasks.',
    color: 'from-rose-500/20 to-rose-500/5',
    accent: '#f43f5e',
  },
  {
    icon: '🏅',
    title: 'Completion Certificates',
    desc: 'Finish all lessons in a course and instantly download a beautiful certificate with your name, XP, and date.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: '#10b981',
  },
  {
    icon: '👩‍🏫',
    title: 'Teacher & Admin Dashboard',
    desc: 'Teachers create lessons and tasks. Admins review submissions, manage roles, broadcast announcements, and block cheaters.',
    color: 'from-fuchsia-500/20 to-fuchsia-500/5',
    accent: '#d946ef',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'Visual progress bars per course on your dashboard. See exactly how many lessons you\'ve completed at a glance.',
    color: 'from-sky-500/20 to-sky-500/5',
    accent: '#0ea5e9',
  },
  {
    icon: '🔔',
    title: 'Real-Time Notifications',
    desc: 'Get notified when a new lesson drops, a task is graded, or a daily challenge goes live — all inside the app.',
    color: 'from-yellow-500/20 to-yellow-500/5',
    accent: '#eab308',
  },
]

const STATS = [
  { value: '2',    label: 'Language Courses (C & Python)' },
  { value: '50+',  label: 'Coding Challenges' },
  { value: 'XP',   label: 'Gamified Levels & Ranks' },
  { value: '100%', label: 'Secure & Anti-Cheat' },
]

const STEPS = [
  { step: '01', title: 'Sign in with Google', desc: 'One-click authentication. No passwords, no hassle.' },
  { step: '02', title: 'Pick C or Python',    desc: 'Choose your language and start structured lessons at your own pace.' },
  { step: '03', title: 'Solve Tasks & Earn XP', desc: 'Submit code, take quizzes, and beat daily challenges to level up.' },
  { step: '04', title: 'Get Certified',       desc: 'Complete a course to download your personalised certificate.' },
]

export default function Landing() {
  const user = useStore(s => s.user)
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <main style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-32 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-8 animate-fade-in"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Now Live · Beta v1.0
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] animate-fade-up">
            Learn to Code<br />
            <span className="gradient-text">Securely & Fast</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed animate-fade-up" style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>
            A modern programming education platform with live code execution, admin-reviewed submissions, 
            XP-based gamification, and enterprise-grade security — all in one place.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/login" className="btn-primary px-8 py-3.5 text-base btn-glow" style={{ borderRadius: '14px' }}>
              Start Learning Free →
            </Link>
            <Link to="/courses"
              className="btn-ghost px-8 py-3.5 text-base"
              style={{ borderRadius: '14px' }}>
              Browse Lessons
            </Link>
          </div>

          <p className="mt-5 text-xs animate-fade-in" style={{ color: 'var(--text-muted)', animationDelay: '0.3s' }}>
            No credit card required · Sign in with Google · Free forever
          </p>

          {/* Social proof avatars */}
          <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="flex -space-x-2">
              {['A','B','C','D','E'].map((l, i) => (
                <span key={l} className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-slate-900"
                  style={{ background: `hsl(${i * 40 + 180}, 70%, 45%)` }}>{l}</span>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold text-white">100+</span> students already learning
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-black gradient-text">{value}</p>
              <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3 block">Platform Features</span>
          <h2 className="text-3xl md:text-4xl font-black">Everything you need to master coding</h2>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Built for learners, designed for educators. One platform for everything.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {FEATURES.map(({ icon, title, desc, color, accent }) => (
            <div key={title}
              className="card-hover glass-card rounded-2xl p-6 flex flex-col gap-3 animate-fade-up gradient-border"
              style={{ '--accent': accent }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${color.replace('from-','').replace('/20','/15').replace(' to-','')})` }}>
                {icon}
              </div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6 py-28">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-black">Start learning in 4 simple steps</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc }, idx) => (
              <div key={step} className="relative">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(90deg, var(--border-default), transparent)' }} />
                )}
                <div className="glass-card rounded-2xl p-6 relative z-10">
                  <span className="text-3xl font-black gradient-text block mb-3">{step}</span>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <div className="rounded-3xl p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.6) 0%, transparent 70%)' }} />
          </div>

          <div className="relative">
            <span className="text-4xl mb-4 block">🚀</span>
            <h2 className="text-3xl md:text-4xl font-black">Ready to start your coding journey?</h2>
            <p className="mt-4 text-base max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join hundreds of students building real programming skills — for free.
            </p>
            <Link to="/login"
              className="btn-primary mt-8 inline-flex px-10 py-4 text-base btn-glow"
              style={{ borderRadius: '14px' }}>
              Get started for free →
            </Link>
            <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>No setup, no credit card. Just Google Sign-in.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

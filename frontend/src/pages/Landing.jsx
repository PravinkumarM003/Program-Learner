import { Link, Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

const FEATURES = [
  {
    icon: '💻',
    title: 'C & Python Courses',
    desc: 'Structured learning paths for both C and Python — lessons, quizzes, and hands-on coding tasks from beginner to advanced.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    accent: '#06b6d4',
  },
  {
    icon: '🤖',
    title: 'Free AI Tutor',
    desc: 'Ask anything in the built-in AI assistant — completely free for all students. Get explanations, hints, and code reviews instantly.',
    color: 'from-violet-500/20 to-violet-500/5',
    accent: '#8b5cf6',
  },
  {
    icon: '🔥',
    title: 'Daily Challenges',
    desc: 'A fresh coding challenge every day. Solve it to earn bonus XP and climb the leaderboard before the timer runs out.',
    color: 'from-orange-500/20 to-orange-500/5',
    accent: '#f97316',
  },
  {
    icon: '🏆',
    title: 'XP, Ranks & Leaderboard',
    desc: 'Earn XP for every task, lesson, and quiz. Unlock ranks from First Steps all the way to God Tier (1,000,000 XP). Compete globally.',
    color: 'from-amber-500/20 to-amber-500/5',
    accent: '#f59e0b',
  },
  {
    icon: '🎖️',
    title: 'Achievements & Badges',
    desc: '13 progressive achievements from Rising Star to Grandmaster and beyond. Each badge unlocks as your XP grows.',
    color: 'from-yellow-500/20 to-yellow-500/5',
    accent: '#eab308',
  },
  {
    icon: '🔐',
    title: 'Anti-Cheat & Exam Mode',
    desc: 'Tab-switch detection, copy-paste blocking, and a full-screen lockdown mode during tests. 3 violations = auto-ban.',
    color: 'from-rose-500/20 to-rose-500/5',
    accent: '#f43f5e',
  },
  {
    icon: '🛡️',
    title: 'Real-Time Security Alerts',
    desc: 'Hacking attempts (SQL injection, path traversal) are detected instantly. Attackers are identified by IP & user ID and reported to the admin.',
    color: 'from-red-500/20 to-red-500/5',
    accent: '#ef4444',
  },

  {
    icon: '👩‍🏫',
    title: 'Teacher & Admin Panel',
    desc: 'Teachers create Coding Tasks, Quizzes, and General Questions directly. Admins manage users, block IPs, give XP, and send broadcasts.',
    color: 'from-fuchsia-500/20 to-fuchsia-500/5',
    accent: '#d946ef',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'Visual per-course progress bars on your dashboard. See exactly how many lessons you\'ve completed and how much XP each earned.',
    color: 'from-sky-500/20 to-sky-500/5',
    accent: '#0ea5e9',
  },
  {
    icon: '📴',
    title: 'Offline & Low-Internet Mode',
    desc: 'The app works even on slow 2G connections. A smart Service Worker caches your lessons so you can keep learning without interruptions.',
    color: 'from-slate-500/20 to-slate-500/5',
    accent: '#64748b',
  },
  {
    icon: '🔔',
    title: 'Real-Time Notifications',
    desc: 'Get notified when a task is graded, a new lesson drops, a daily challenge goes live, or a broadcast is sent by your teacher.',
    color: 'from-yellow-400/20 to-yellow-400/5',
    accent: '#facc15',
  },
]

const STATS = [
  { value: '2',     label: 'Language Courses (C & Python)' },
  { value: '13',    label: 'Achievement Badges to Unlock' },
  { value: '100%',  label: 'Free AI Tutor — No XP Cost' },
  { value: '🛡️',   label: 'Enterprise-Grade Security' },
]

const STEPS = [
  { step: '01', title: 'Sign in with Google',       desc: 'One-click authentication. No passwords, no credit card, no hassle.' },
  { step: '02', title: 'Pick C or Python',           desc: 'Choose your language and start structured lessons at your own pace.' },
  { step: '03', title: 'Solve Tasks & Earn XP',     desc: 'Submit code, take quizzes, beat daily challenges, and ask the AI tutor when stuck.' },
  { step: '04', title: 'Unlock Ranks & Badges', desc: 'Level up from First Steps to God Tier and earn exclusive achievement badges.' },
]

const ROLES = [
  {
    icon: '🎓',
    title: 'Student',
    color: 'border-cyan-500/30 from-cyan-900/20 to-cyan-900/5',
    accent: '#06b6d4',
    perks: ['Access C & Python courses', 'Complete tasks & quizzes', 'Earn XP & unlock achievements', 'Ask the AI tutor for free', 'Daily challenge bonuses'],
  },
  {
    icon: '👩‍🏫',
    title: 'Teacher',
    color: 'border-violet-500/30 from-violet-900/20 to-violet-900/5',
    accent: '#8b5cf6',
    perks: ['Create Coding Tasks, Quizzes & General Questions', 'Review & grade student submissions', 'Instant feedback on student work', 'Direct access to content manager'],
  },
  {
    icon: '⚙️',
    title: 'Admin',
    color: 'border-rose-500/30 from-rose-900/20 to-rose-900/5',
    accent: '#f43f5e',
    perks: ['Full user management & role control', 'Give XP, block IPs, manage security', 'Send broadcast notifications', 'View violation & hacking alerts', 'Set daily challenges', 'Analytics dashboard'],
  },
]

export default function Landing() {
  const user = useStore(s => s.user)
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <main style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-8 animate-fade-in"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Now Live · Free for All Students
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] animate-fade-up">
            Learn to Code.<br />
            <span className="gradient-text">Level Up. Master Code.</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed animate-fade-up" style={{ color: 'var(--text-secondary)', animationDelay: '0.1s' }}>
            A gamified, AI-powered, anti-cheat programming school for C and Python. 
            Earn XP, unlock achievements, and beat daily challenges — all for free.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/login" className="btn-primary px-8 py-3.5 text-base btn-glow" style={{ borderRadius: '14px' }}>
              Start Learning Free →
            </Link>
            <Link to="/courses" className="btn-ghost px-8 py-3.5 text-base" style={{ borderRadius: '14px' }}>
              Browse Courses
            </Link>
          </div>

          <p className="mt-5 text-xs animate-fade-in" style={{ color: 'var(--text-muted)', animationDelay: '0.3s' }}>
            No credit card · Sign in with Google · Free AI tutor · Works offline
          </p>

          <div className="mt-12 flex justify-center animate-bounce">
            <button onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })} className="text-cyan-500 opacity-70 hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
              <span className="text-sm font-medium tracking-wide">Explore Features</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            </button>
          </div>

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
            Built for learners, designed for educators — with enterprise-grade security built in.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {FEATURES.map(({ icon, title, desc, accent }) => (
            <div key={title}
              className="card-hover glass-card rounded-2xl p-6 flex flex-col gap-3 animate-fade-up gradient-border"
              style={{ '--accent': accent }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${accent}1a` }}>
                {icon}
              </div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-500 mb-3 block">Three Roles, One Platform</span>
            <h2 className="text-3xl md:text-4xl font-black">Built for Students, Teachers & Admins</h2>
            <p className="mt-4 text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Every user has a tailored experience based on their role.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {ROLES.map(({ icon, title, color, accent, perks }) => (
              <div key={title} className={`glass-card rounded-2xl p-6 border bg-gradient-to-b ${color} space-y-4`}>
                <div className="text-4xl">{icon}</div>
                <h3 className="font-black text-white text-lg">{title}</h3>
                <ul className="space-y-2">
                  {perks.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: accent }} className="mt-0.5 shrink-0">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3 block">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-black">Start learning in 4 simple steps</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, title, desc }, idx) => (
            <div key={step} className="relative">
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
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-6 pb-28 text-center">
        <div className="rounded-3xl p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.6) 0%, transparent 70%)' }} />
          </div>
          <div className="relative">
            <span className="text-5xl mb-4 block">🚀</span>
            <h2 className="text-3xl md:text-4xl font-black">Ready to start your coding journey?</h2>
            <p className="mt-4 text-base max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Join students mastering C and Python — with a free AI tutor, daily challenges, and achievement badges waiting for you.
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

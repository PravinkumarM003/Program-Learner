import { useState } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

const PLATFORM_FEATURES = [
  { icon: '💻', label: 'C & Python Courses',         desc: 'Structured lessons, quizzes, and coding tasks for both languages' },
  { icon: '🤖', label: 'Free AI Tutor',               desc: 'Ask anything, any time — no XP cost, free for all students' },
  { icon: '🔥', label: 'Daily Challenges',             desc: 'A new challenge every day with bonus XP and leaderboard rewards' },
  { icon: '🏆', label: 'XP, Ranks & Leaderboard',    desc: 'Earn XP and climb from First Steps to God Tier (1,000,000 XP)' },
  { icon: '🎖️', label: 'Achievements & Badges',       desc: '13 progressive badges that unlock as your XP grows' },
  { icon: '🔐', label: 'Anti-Cheat & Exam Mode',      desc: 'Tab-switch detection, copy-paste blocking, and auto-IP-ban after 3 violations' },
  { icon: '🛡️', label: 'Hacking Detection',           desc: 'SQL injections & malicious payloads blocked; attacker IP & ID reported to admin' },
  { icon: '👩‍🏫', label: 'Teacher Dashboard',          desc: 'Create Coding Tasks, Quizzes, and General Questions; review submissions' },
  { icon: '⚙️', label: 'Admin Panel',                 desc: 'Manage users, roles, XP, blocked IPs, broadcasts, and security alerts' },
  { icon: '📴', label: 'Offline & Low-Internet Mode', desc: 'Service Worker caches lessons so you keep learning even on slow connections' },
  { icon: '📊', label: 'Progress Tracking',           desc: 'Visual per-course progress bars and XP breakdown on your dashboard' },
]

export default function About() {
  const user = useStore(s => s.user)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await api.post('/feedback', { name, email, rating, message })
      setSuccess(true)
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16 flex-grow">

        {/* ── Hero ── */}
        <div className="text-center space-y-4 relative">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)' }} />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full">
            About Program Learner
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
            Your gamified, AI-powered{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              coding school
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Program Learner is an interactive platform where students learn C and Python through 
            structured lessons, live coding, a free AI tutor, daily challenges, and achievements — all with enterprise-grade security built in.
          </p>
          {!user && (
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/login" className="btn-primary px-8 py-3 text-sm rounded-xl">Start Learning Free →</Link>
              <Link to="/courses" className="btn-ghost px-8 py-3 text-sm rounded-xl">Browse Courses</Link>
            </div>
          )}
        </div>

        {/* ── Developer Card ── */}
        <div className="glass-card rounded-3xl p-8 border border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-violet-900/20 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative shrink-0 z-10 group mt-4 sm:mt-0">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400 animate-[spin_4s_linear_infinite]" />
            <div className="relative p-2 bg-slate-900 rounded-full h-64 w-64 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
              <img
                src="/images/pravin-photo.jpg?v=2"
                alt="Pravin Kumar M"
                className="h-full w-full rounded-full object-cover"
                style={{ objectPosition: 'center' }}
              />
            </div>
          </div>

          <div className="space-y-3 text-center sm:text-left relative z-10 flex-1">
            <div>
              <h2 className="font-black text-white text-3xl tracking-tight mb-1">Pravin Kumar M</h2>
              <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Creator & Lead Developer</p>
            </div>
            <p className="text-slate-300 leading-relaxed max-w-lg">
              Passionate software engineer who built Program Learner from the ground up.
              The mission: give every student a real, structured, and secure path to mastering programming — 
              with AI assistance, gamification, and anti-cheat tools that actually work.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1 max-w-xs sm:max-w-none">
              {[
                { href: 'https://www.linkedin.com/in/pravinkumar-m/', icon: '🔗', label: 'LinkedIn', color: 'hover:bg-cyan-500/20 text-cyan-400 hover:border-cyan-500/30' },
                { href: 'https://github.com/PravinkumarM003/', icon: '🐙', label: 'GitHub', color: 'hover:bg-violet-500/20 text-violet-400 hover:border-violet-500/30' },
                { href: 'https://www.instagram.com/pravin.a.i', icon: '📸', label: 'Instagram', color: 'hover:bg-pink-500/20 text-pink-400 hover:border-pink-500/30' },
              ].map(({ href, icon, label, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-xs font-bold transition-all border border-transparent ${color}`}>
                  <span>{icon}</span>{label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Platform Features ── */}
        <div>
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2 block">What's Inside</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Everything the platform offers</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PLATFORM_FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="glass-card rounded-2xl p-5 border border-white/5 space-y-2 card-hover">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-white text-sm">{label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ── */}
        <div>
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 block">Three Roles</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Built for Students, Teachers & Admins</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: '🎓', title: 'Students', accent: 'border-cyan-500/30 text-cyan-400',
                items: ['Access C & Python lessons & tasks', 'Earn XP and unlock achievements', 'Ask the AI tutor for free', 'Beat daily challenges'],
              },
              {
                icon: '👩‍🏫', title: 'Teachers', accent: 'border-violet-500/30 text-violet-400',
                items: ['Create Coding Tasks, Quizzes, General Questions', 'Review and grade submissions', 'Add feedback to student work', 'Manage course content directly'],
              },
              {
                icon: '⚙️', title: 'Admins', accent: 'border-rose-500/30 text-rose-400',
                items: ['Manage users, roles & XP', 'Block IPs & view security alerts', 'Send broadcast notifications', 'Set daily challenges', 'View analytics & violations'],
              },
            ].map(({ icon, title, accent, items }) => (
              <div key={title} className={`glass-card rounded-2xl p-6 border space-y-3 ${accent.split(' ')[0]}`}>
                <span className="text-3xl">{icon}</span>
                <h3 className={`font-bold text-lg ${accent.split(' ')[1]}`}>{title}</h3>
                <ul className="space-y-1.5">
                  {items.map(i => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className={`mt-0.5 shrink-0 ${accent.split(' ')[1]}`}>✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Vision & Mission ── */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-6 border border-cyan-500/10 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2"><span className="text-cyan-400">🎯</span> Vision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              To build a world where anyone can master programming and write clean, structured, and secure code — 
              regardless of their background, internet speed, or prior experience.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-6 border border-violet-500/10 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-2"><span className="text-violet-400">🚀</span> Mission</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              To provide interactive, gamified, and secure coding education — with a free AI tutor, 
              daily challenges, and achievements — so every student grows into a confident developer.
            </p>
          </div>
        </div>

        {/* ── Feedback Form ── */}
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden max-w-2xl mx-auto w-full">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl font-black text-white mb-1">Send Feedback</h2>
          <p className="text-slate-400 text-sm mb-6">Let us know how we can improve tasks, lessons, or the overall experience.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase block">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase block">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="name@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    className="text-2xl transition-transform hover:scale-125 active:scale-95">
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Your Message</label>
              <textarea rows={4} required value={message} onChange={e => setMessage(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans leading-relaxed"
                placeholder="What did you think of the app? Any suggestions?" />
            </div>

            {success && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-xs font-bold text-green-400">
                ✓ Thank you! Your feedback has been saved.
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full btn-glow rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 transition-opacity">
              {submitting ? '⏳ Submitting...' : 'Send Feedback →'}
            </button>
          </form>
        </div>

      </div>
      <Footer />
    </div>
  )
}

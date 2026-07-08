import { useState } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'
import { Link } from 'react-router-dom'

const PLATFORM_FEATURES = [
  { icon: '💻', label: 'C & Python Courses', desc: 'Separate structured paths for both languages' },
  { icon: '🔥', label: 'Daily Challenges', desc: 'New challenge every day with XP rewards' },
  { icon: '🏆', label: 'Ranks & Leaderboard', desc: 'Bronze → Grandmaster level system' },
  { icon: '🤖', label: 'AI Hints', desc: 'Spend XP for intelligent help when stuck' },
  { icon: '🔐', label: 'Anti-Cheat & Exam Mode', desc: 'IP blocking, copy-paste detection, lockdown' },
  { icon: '🏅', label: 'Certificates', desc: 'Download on 100% course completion' },
  { icon: '👩‍🏫', label: 'Teacher Dashboard', desc: 'Create lessons, tasks and review submissions' },
  { icon: '📊', label: 'Progress Tracking', desc: 'Visual per-course progress bars' },
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
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

      {/* ── Hero ── */}
      <div className="text-center space-y-4 relative">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)' }} />
        </div>
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full">
          About Programmer Learner
        </span>
        <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
          Built to help you <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">master programming</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          An interactive web platform where students learn C and Python through structured lessons, live coding, gamified XP, daily challenges, and certified completion.
        </p>
        {!user && (
          <div className="flex justify-center gap-4 pt-2">
            <Link to="/login" className="btn-primary px-8 py-3 text-sm rounded-xl">Start Learning Free →</Link>
            <Link to="/courses" className="btn-ghost px-8 py-3 text-sm rounded-xl">Browse Lessons</Link>
          </div>
        )}
      </div>

      {/* ── Developer Card ── */}
      <div className="glass-card rounded-3xl p-8 border border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-violet-900/20 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />

        <img
          src="/images/pravin-photo.jpg"
          alt="Pravin Kumar M"
          className="h-50 w-30 rounded-full object-cover shadow-[0_0_30px_rgba(6,182,212,0.4)] shrink-0 border-4 border-cyan-400/80 relative z-10"
          style={{ objectPosition: 'center top' }}
        />
        <div className="space-y-3 text-center sm:text-left relative z-10 flex-1">
          <div>
            <h2 className="font-black text-white text-3xl tracking-tight mb-1">Pravin Kumar M</h2>
            <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Creator & Lead Developer</p>
          </div>
          <p className="text-slate-300 leading-relaxed max-w-lg">
            Passionate software engineer focused on building interactive, secure, and scalable learning experiences.
            Programmer Learner was built from the ground up to give students a real, structured path to mastering code.
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

      {/* ── Vision & Mission ── */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/10 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2"><span className="text-cyan-400">🎯</span> Vision</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            To build a world where anyone can master programming and write clean, structured, and secure code — regardless of background.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-violet-500/10 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-2"><span className="text-violet-400">🚀</span> Mission</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            To provide interactive, gamified, and secure coding courses so every student grows into a confident developer.
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
  )
}

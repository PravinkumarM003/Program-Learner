import { useState } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'

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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Info Column */}
        <div className="space-y-6">
          {/* Developer Profile Card */}
          <div className="glass-card rounded-3xl p-8 border border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-violet-900/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <img 
              src="/images/pravin-photo.jpg" 
              alt="Pravin kumar M" 
              className="h-36 w-36 rounded-full object-contain bg-slate-900/80 shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0 border-4 border-cyan-400/80 relative z-10"
            />
            <div className="space-y-3 text-center sm:text-left relative z-10 flex-1">
              <div>
                <h4 className="font-black text-white text-2xl tracking-tight mb-1">Pravin Kumar M</h4>
                <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Creator & Lead Developer</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                Passionate software engineer focused on building interactive, secure, and scalable web experiences to empower the next generation of developers.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2">
                <a href="https://www.linkedin.com/in/pravinkumar-m/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-xs font-bold text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30">
                  <span>🔗</span> LinkedIn
                </a>
                <a href="https://github.com/pravinkumar-m" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 text-xs font-bold text-violet-400 transition-all border border-transparent hover:border-violet-500/30">
                  <span>🐙</span> GitHub
                </a>
                <a href="https://www.instagram.com/pravin.a.i" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-pink-500/20 text-xs font-bold text-pink-400 transition-all border border-transparent hover:border-pink-500/30">
                  <span>📸</span> Instagram
                </a>
                <a href="https://your-portfolio-link.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-xs font-bold text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30">
                  <span>🌐</span> Portfolio
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full">
              About Programmer Learner
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Master Program with <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">Hands-on Tasks</span>
            </h1>
          </div>
          
          <p className="text-slate-400 text-lg leading-relaxed">
            Programmer Learner is an interactive web-based programming learning platform designed to help students learn and write clean, structured code. The platform features structured lessons, general explanation challenges, multiple-choice quizzes, and real-time execution in a secure sandbox environment.
          </p>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="text-cyan-400">🎯</span> Vision
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To build a world where anyone can master programming and write clean, structured, and secure code efficiently.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="text-violet-400">🚀</span> Mission
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To provide interactive courses, secure execution environments, and gamified challenges to empower student growth.
              </p>
            </div>
          </div>

          {/* Platform Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <span className="text-2xl">💻</span>
              <h3 className="font-bold text-white text-sm">Coding Sandbox</h3>
              <p className="text-xs text-slate-500">Run and test code instantly inside a secure sandbox runner.</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-white text-sm">Gamified XP</h3>
              <p className="text-xs text-slate-500">Earn Experience Points (XP) for completing lessons and coding challenges.</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <span className="text-2xl">🔒</span>
              <h3 className="font-bold text-white text-sm">Lock-down Mode</h3>
              <p className="text-xs text-slate-500">Protected, secure layout preventing cheats and outside references.</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2">
              <span className="text-2xl">🤖</span>
              <h3 className="font-bold text-white text-sm">Ask AI</h3>
              <p className="text-xs text-slate-500">Spend earned XP to get intelligent AI hints and explanations when stuck on a task.</p>
            </div>
          </div>
        </div>

        {/* Feedback Form Column */}
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl font-black text-white mb-2">Send Us Your Feedback</h2>
          <p className="text-slate-400 text-sm mb-6">Let us know how we can improve the tasks, quizzes, lessons, or overall app experience!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="Optional name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Message</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans leading-relaxed"
                placeholder="What did you think of the tasks or the app? Describe any improvements..."
              />
            </div>

            {success && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-xs font-bold text-green-400">
                ✓ Thank you for your feedback! It has been successfully saved.
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-glow rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 transition-opacity"
            >
              {submitting ? '⏳ Submitting...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import api from '../api/client'

const STATUS_CLASSES = {
  Pending:     { badge: 'badge badge-pending',  icon: '⏳' },
  UnderReview: { badge: 'badge badge-review',   icon: '🔍' },
  Accepted:    { badge: 'badge badge-accepted', icon: '✅' },
  Rejected:    { badge: 'badge badge-rejected', icon: '❌' },
}

function StatCard({ label, value, icon, gradient, sub, loading }) {
  return (
    <div className="glass-card card-hover rounded-2xl p-5 flex flex-col gap-2 animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{ background: `linear-gradient(135deg, ${gradient})` }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-black text-white mt-1">
          {loading ? <span className="skeleton inline-block w-16 h-7 rounded-lg" /> : value}
        </p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {sub && !loading && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useStore(s => s.user)
  const [subs, setSubs] = useState([])
  const [progress, setProgress] = useState([])
  const [xpData, setXpData] = useState({ xp: 0, lessonXp: 0, taskXp: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/submissions').then(r => setSubs(r.data?.submissions || [])).catch(() => {}),
      api.get('/progress').then(r => setProgress(r.data?.progress || [])).catch(() => {}),
      api.get('/user/xp').then(r => setXpData(r.data || {})).catch(() => {}),
      api.get('/user/leaderboard').then(r => setLeaderboard(r.data?.leaderboard || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const lessonXpLocal = progress.reduce((sum, p) => sum + (p.xp || 0), 0)
  const taskXpLocal   = subs.reduce((sum, s) => sum + (s.earnedXp || 0), 0)
  const totalXp       = xpData.xp > 0 ? xpData.xp : (lessonXpLocal + taskXpLocal)
  const lessonsDone   = progress.filter(p => p.completed).length
  const displayLessonXp = xpData.xp > 0 ? (xpData.lessonXp || 0) : lessonXpLocal
  const displayTaskXp   = xpData.xp > 0 ? (xpData.taskXp || 0) : taskXpLocal
  const myRankIndex   = user ? leaderboard.findIndex(u => u.id === user.id) : -1
  const myRank        = myRankIndex >= 0 ? `#${myRankIndex + 1}` : '—'
  const acceptedCount = subs.filter(s => s.status === 'Accepted').length

  const STATS = [
    { label: 'Total XP Earned',   value: totalXp,       icon: '⚡', gradient: '#f59e0b, #ef4444', sub: `📚 ${displayLessonXp} lesson · 🎯 ${displayTaskXp} task` },
    { label: 'Lessons Completed', value: lessonsDone,   icon: '📚', gradient: '#10b981, #059669', sub: null },
    { label: 'Tasks Accepted',    value: acceptedCount, icon: '✅', gradient: '#06b6d4, #3b82f6', sub: `of ${subs.length} total submissions` },
    { label: 'Leaderboard Rank',  value: myRank,        icon: '🏆', gradient: '#8b5cf6, #7c3aed', sub: myRankIndex >= 0 ? 'Keep climbing!' : 'Submit tasks to rank' },
  ]

  const recentSubs = subs.slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

      {/* ── Page Header ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Your Learning Hub</p>
          <h1 className="text-3xl font-black text-white">
            Hey, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Here's your progress overview
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/courses" className="btn-ghost text-sm px-4 py-2">Browse Lessons</Link>
          <Link to="/tasks" className="btn-primary text-sm px-4 py-2">View Tasks →</Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Submissions — takes 2/3 */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="font-bold text-white">Recent Submissions</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Your latest activity</p>
              </div>
              <Link to="/submissions" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : recentSubs.length > 0 ? (
              <div className="divide-y" style={{ divideColor: 'var(--border-subtle)' }}>
                {recentSubs.map(s => {
                  const st = STATUS_CLASSES[s.status] || { badge: 'badge', icon: '❓' }
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xl flex-shrink-0">{st.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.task?.title || 'Task'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(s.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.earnedXp > 0 && <span className="text-xs font-bold text-amber-400">⚡+{s.earnedXp}</span>}
                        {s.marks != null && <span className="text-xs font-bold text-cyan-400">{s.marks} pts</span>}
                        <span className={st.badge}>{s.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <span className="text-5xl block mb-4">📭</span>
                <p className="text-sm font-semibold text-white mb-1">No submissions yet</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Pick a task and submit your first solution!</p>
                <Link to="/tasks" className="btn-primary text-sm px-5 py-2">Browse Tasks →</Link>
              </div>
            )}
          </div>

          {/* ── Achievements (Mock UI Phase 1) ── */}
          <div className="glass-card rounded-2xl overflow-hidden mt-6">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="font-bold text-white flex items-center gap-2">🏆 Your Achievements</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Badges you've earned</p>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: 1, title: 'First Steps', desc: 'Completed your first lesson.', icon: '👶', unlocked: true },
                { id: 2, title: 'Night Owl', desc: 'Submitted a task after midnight.', icon: '🦉', unlocked: true },
                { id: 3, title: 'Flawless Execution', desc: 'Passed all tests on the first try.', icon: '✨', unlocked: false },
                { id: 4, title: 'C Guru', desc: 'Completed 10 tasks in C.', icon: '🎯', unlocked: false },
                { id: 5, title: 'Week Streak', desc: 'Logged in for 7 consecutive days.', icon: '🔥', unlocked: true },
                { id: 6, title: 'Helper', desc: 'Left a helpful comment.', icon: '💬', unlocked: false },
              ].map(badge => (
                <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.unlocked ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 opacity-50 grayscale'}`}>
                  <span className="text-4xl mb-2 drop-shadow-lg">{badge.icon}</span>
                  <h3 className={`text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>{badge.title}</h3>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-white text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/tasks',       icon: '🎯', label: 'Solve a Task',       sub: 'Code, Quiz, or General' },
                { to: '/courses',     icon: '📚', label: 'Continue a Lesson',  sub: 'Pick up where you left off' },
                { to: '/leaderboard', icon: '🏆', label: 'Check Leaderboard',  sub: `You're ranked ${myRank}` },
                { to: '/submissions', icon: '📝', label: 'View Submissions',    sub: `${subs.length} total` },
              ].map(({ to, icon, label, sub }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Mini leaderboard */}
          {leaderboard.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Top Students</h3>
                <Link to="/leaderboard" className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold">Full list →</Link>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((u, i) => {
                  const isMe = u.id === user?.id
                  const medals = ['🥇','🥈','🥉']
                  return (
                    <div key={u.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isMe ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'hover:bg-white/5'}`}>
                      <span className="text-sm w-5 text-center font-bold">{medals[i] || `${i+1}`}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                        {(u.name || u.email)[0].toUpperCase()}
                      </span>
                      <p className={`text-xs font-medium flex-1 truncate ${isMe ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {u.name || u.email} {isMe && '(you)'}
                      </p>
                      <p className="text-xs font-bold text-amber-400">⚡{u.score}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

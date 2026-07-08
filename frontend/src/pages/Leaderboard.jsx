import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import api from '../api/client'
import { getXpDetails } from '../utils/ranks'
import Footer from '../components/Footer'

const PODIUM = [
  { rank: 2, medal: '🥈', height: 'h-20',  label: '2nd', color: '#94a3b8', glow: 'rgba(148,163,184,0.2)' },
  { rank: 1, medal: '🥇', height: 'h-28',  label: '1st', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { rank: 3, medal: '🥉', height: 'h-16',  label: '3rd', color: '#cd7c42', glow: 'rgba(205,124,66,0.2)' },
]

export default function Leaderboard() {
  const currentUser = useStore(s => s.user)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/user/leaderboard')
      .then(res => setLeaderboard(res.data?.leaderboard || []))
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  const userIndex = currentUser ? leaderboard.findIndex(u => u.id === currentUser.id) : -1
  const top3      = leaderboard.slice(0, 3)
  const rest      = leaderboard.slice(3)

  const ordinal = (n) => {
    const s = ['th','st','nd','rd'], v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 w-full flex-grow">

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Rankings</p>
        <h1 className="text-4xl font-black text-white">🏆 Leaderboard</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Compete with fellow students and rise to the top
        </p>
      </div>

      {/* ── My rank banner ── */}
      {!loading && userIndex >= 0 && (
        <div className="glass-card rounded-2xl p-4 mb-8 animate-fade-in flex items-center justify-between gap-4"
          style={{ borderColor: 'rgba(6,182,212,0.3)', borderWidth: '1px' }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
              {(currentUser?.name || currentUser?.email || 'U')[0].toUpperCase()}
            </span>
            <div>
              <p className="text-xs text-slate-400">Your current ranking</p>
              <p className="font-black text-white text-lg">{ordinal(userIndex + 1)} Place</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Score</p>
            <p className="font-black text-amber-400 text-xl">⚡ {leaderboard[userIndex]?.score}</p>
          </div>
          {userIndex > 0 && (
            <Link to="/tasks" className="btn-primary text-xs px-4 py-2 hidden sm:flex">
              Earn more XP →
            </Link>
          )}
        </div>
      )}

      {!loading && userIndex === -1 && (
        <div className="glass-card rounded-2xl p-5 mb-8 text-center animate-fade-in"
          style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
          <p className="text-sm font-semibold text-white mb-1">You're not ranked yet!</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Submit tasks and complete lessons to appear on the board.</p>
          <Link to="/tasks" className="btn-primary text-sm px-5 py-2">Start earning XP →</Link>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <>
          {/* ── Podium top 3 ── */}
          {top3.length >= 2 && (
            <div className="flex items-end justify-center gap-4 mb-10 animate-fade-up">
              {PODIUM.map(({ rank, medal, height, label, color, glow }) => {
                const entry = top3[rank - 1]
                if (!entry) return null
                const isMe = currentUser && entry.id === currentUser.id
                return (
                  <div key={rank} className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                    {/* Avatar */}
                    <div className="relative">
                      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white transition-transform hover:scale-105`}
                        style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, boxShadow: `0 8px 24px ${glow}`, border: `2px solid ${color}66` }}>
                        {(entry.name || 'U')[0].toUpperCase()}
                      </span>
                      {(() => {
                        const { rankBadge } = getXpDetails(entry.score);
                        return <span className="absolute -top-3 -left-3 text-2xl drop-shadow-md" title="Rank Badge">{rankBadge}</span>;
                      })()}
                      <span className="absolute -top-2 -right-2 text-lg">{medal}</span>
                      {isMe && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-900" />}
                    </div>
                    <p className="text-xs font-bold text-white text-center truncate w-full px-1">{entry.name}</p>
                    <p className="text-[10px] font-semibold text-amber-400">⚡{entry.score} • Lvl {getXpDetails(entry.score).level}</p>
                    {/* Podium base */}
                    <div className={`w-full ${height} rounded-t-xl flex items-end justify-center pb-2 text-xs font-black`}
                      style={{ background: `linear-gradient(180deg, ${color}33 0%, ${color}15 100%)`, border: `1px solid ${color}33`, color }}>
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Ranked list (4th+) ── */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-7">Student</div>
              <div className="col-span-3 text-right">Score</div>
            </div>

            {/* Top 3 in list too */}
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {leaderboard.map((u, idx) => {
                const isMe = currentUser && u.id === currentUser.id
                const medals = ['🥇','🥈','🥉']
                return (
                  <div key={u.id}
                    className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center transition-colors ${
                      isMe ? 'bg-cyan-500/5' : 'hover:bg-white/[0.02]'
                    }`}>
                    <div className="col-span-2 text-center">
                      {idx < 3
                        ? <span className="text-lg">{medals[idx]}</span>
                        : <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</span>
                      }
                    </div>
                    <div className="col-span-7 flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                        {(u.name || 'U')[0].toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className={`text-sm font-semibold truncate block ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                          {u.name || u.email} <span className="text-xs ml-1 opacity-80" title="Rank Badge">{getXpDetails(u.score).rankBadge}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${getXpDetails(u.score).rankColor}`}>Lvl {getXpDetails(u.score).level}</span>
                          {isMe && <span className="text-[10px] text-cyan-500 font-semibold">← You</span>}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="font-black text-amber-400 text-sm">⚡{u.score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="glass-card rounded-2xl p-14 text-center">
          <span className="text-5xl block mb-4">🏆</span>
          <p className="font-bold text-white text-lg mb-2">No rankings yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Be the first to earn XP and top the board!</p>
          <Link to="/tasks" className="btn-primary text-sm px-6 py-2.5">Solve your first task →</Link>
        </div>
      )}
      </div>
      <Footer />
    </div>
  )
}

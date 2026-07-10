import { useEffect, useState } from 'react'
import api from '../api/client'
import Footer from '../components/Footer'

const ACHIEVEMENTS_DATA = [
  { id: 'first_step', title: 'First Steps', desc: 'Earn your first 100 XP', requiredXp: 100, icon: '🌱', color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'quick_learner', title: 'Quick Learner', desc: 'Reach 200 XP', requiredXp: 200, icon: '🍀', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { id: 'first_blood', title: 'Rising Star', desc: 'Earn your first 500 XP', requiredXp: 500, icon: '🐣', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'code_fan', title: 'Code Hobbyist', desc: 'Reach 1000 XP', requiredXp: 1000, icon: '💻', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'steady_progress', title: 'Steady Coder', desc: 'Reach 2500 XP', requiredXp: 2500, icon: '📈', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'novice_coder', title: 'Novice Coder', desc: 'Reach 5000 XP', requiredXp: 5000, icon: '🥉', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'apprentice', title: 'Apprentice', desc: 'Reach 10,000 XP', requiredXp: 10000, icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-300/10' },
  { id: 'journeyman', title: 'Journeyman', desc: 'Reach 25,000 XP', requiredXp: 25000, icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'expert_dev', title: 'Expert Developer', desc: 'Reach 50,000 XP', requiredXp: 50000, icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 'master', title: 'Master', desc: 'Reach 75,000 XP', requiredXp: 75000, icon: '🔥', color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'grandmaster', title: 'Grandmaster', desc: 'Reach 100,000 XP. A true legend!', requiredXp: 100000, icon: '👑', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  { id: 'code_god', title: 'Code God', desc: 'Reach 250,000 XP. Unstoppable!', requiredXp: 250000, icon: '🌌', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { id: 'god_tier', title: 'God Tier', desc: 'Reach 1,000,000 XP. You are unstoppable!', requiredXp: 1000000, icon: '🌟', color: 'text-rose-500', bg: 'bg-rose-500/10' },
]

export default function Achievements() {
  const [xpData, setXpData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/user/xp').then(r => setXpData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const currentXp = xpData?.totalXp || 0

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between">
      <div className="max-w-5xl mx-auto px-4 py-10 w-full flex-grow">
        <div className="mb-10 text-center animate-fade-up">
          <h1 className="text-4xl font-black text-white mb-3">Achievements</h1>
          <p className="text-slate-400">Complete tasks, earn XP, and unlock exclusive titles.</p>
          <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-lg shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            ⚡ {currentXp} XP
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {ACHIEVEMENTS_DATA.map((ach) => {
              const isUnlocked = currentXp >= ach.requiredXp
              const progress = Math.min(100, Math.max(0, (currentXp / ach.requiredXp) * 100))

              return (
                <div key={ach.id} className={`glass-card rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 ${isUnlocked ? 'border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)]' : 'opacity-60 grayscale'}`}>
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-2xl ${isUnlocked ? ach.bg : 'bg-slate-800'}`}>
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-base truncate ${isUnlocked ? ach.color : 'text-slate-400'}`}>
                        {ach.title}
                      </h3>
                      {isUnlocked && <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Unlocked</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{ach.desc}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isUnlocked ? 'bg-cyan-400' : 'bg-cyan-500/50'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">
                      {Math.min(currentXp, ach.requiredXp)} / {ach.requiredXp} XP
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

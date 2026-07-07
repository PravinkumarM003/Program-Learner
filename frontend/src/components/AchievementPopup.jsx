import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'

export default function AchievementPopup() {
  const user = useStore(s => s.user)
  const showToast = useStore(s => s.showToast)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    if (!user) return
    // Check achievements on login/page load
    api.post('/user/achievements/check')
      .then(r => {
        const unlocked = r.data?.newlyUnlocked || []
        if (unlocked.length > 0) {
          setPopup(unlocked[0])
          // Show a toast for additional ones
          unlocked.slice(1).forEach(a => {
            showToast(`🏆 Achievement Unlocked: ${a.title}!`, 'success')
          })
        }
      })
      .catch(() => {})
  }, [user])

  if (!popup) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-confetti glass-card rounded-3xl p-10 text-center max-w-sm mx-4" style={{ border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 60px rgba(245,158,11,0.15)' }}>
        <span className="text-6xl block mb-4">{popup.icon || '🏆'}</span>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Achievement Unlocked!</p>
        <h2 className="text-2xl font-black text-white mb-2">{popup.title}</h2>
        <p className="text-sm text-slate-400 mb-4">{popup.description}</p>
        {popup.xpReward > 0 && (
          <p className="text-sm font-bold text-amber-400 mb-6">⚡ +{popup.xpReward} XP Earned!</p>
        )}
        <button
          onClick={() => setPopup(null)}
          className="btn-primary px-8 py-2.5 text-sm"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'

export default function Settings() {
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const setIdeTheme = useStore(s => s.setIdeTheme)
  const currentIdeTheme = useStore(s => s.ideTheme)
  const showToast = useStore(s => s.showToast)
  const [name, setName] = useState(user?.name || '')
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [xpData, setXpData] = useState(null)

  useEffect(() => {
    api.get('/user/xp').then(r => setXpData(r.data)).catch(() => {})
  }, [])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Placeholder function for handling file upload. Can be hooked to AWS S3 / Cloudinary.
  const handleFileUpload = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)

    // Current implementation: Upload to the Node backend uploads endpoint.
    const res = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data.user
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      showToast('Image must be less than 4MB', 'error')
      return
    }

    // Show local preview immediately over the avatar
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)

    setUploading(true)

    try {
      const updatedUser = await handleFileUpload(file)
      setUser(updatedUser)
      showToast('Profile photo updated!', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to upload photo.', 'error')
      // Revert preview on failure
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleThemeAction = async (theme) => {
    const unlockedThemes = user?.unlockedThemes ? JSON.parse(user.unlockedThemes) : []
    const isUnlocked = theme.id === 'vs-dark' || unlockedThemes.includes(theme.id)

    if (isUnlocked) {
      setIdeTheme(theme.id)
      return
    }

    if (!xpData || xpData.currentXp < theme.price) {
      showToast(`Not enough XP! You need ${theme.price} XP.`, 'error')
      return
    }

    try {
      const r = await api.post('/user/unlock-theme', { themeId: theme.id, price: theme.price })
      setUser({ ...user, unlockedThemes: JSON.stringify(r.data.unlockedThemes) })
      setXpData(prev => ({ ...prev, currentXp: prev.currentXp - theme.price }))
      showToast(`Unlocked ${theme.name}!`, 'success')
    } catch (e) {
      showToast('Failed to unlock theme.', 'error')
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const r = await api.patch('/user/me', { name })
      setUser(r.data?.user)
      setMsg({ ok: true, text: 'Profile updated!' })
    } catch {
      setMsg({ ok: false, text: 'Failed to update. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    api.post('/auth/logout').finally(() => { setUser(null); window.location.href = '/' })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-white mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">Manage your account preferences</p>

      {/* Profile */}
      <div className="glass-card rounded-2xl p-8 mb-6">
        <h2 className="font-bold text-white mb-6 flex items-center gap-2">👤 Profile</h2>

        <div className="flex items-center gap-4 mb-6">
          <div 
            onClick={handleAvatarClick}
            className="relative h-16 w-16 rounded-2xl overflow-hidden cursor-pointer group shadow-lg ring-2 ring-cyan-500/30"
          >
            <img
              src={localPreview || user?.avatarUrl || "/images/pravin-photo.jpg"}
              alt="Profile"
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-30"
            />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Subtle camera icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-0.5 text-cyan-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider">Change</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
          <div>
            <p className="font-semibold text-white">{user?.name || '—'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${
              user?.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'
            }`}>{user?.role}</span>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 placeholder-slate-600"
              placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
          </div>

          {msg && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${msg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="btn-glow w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Theme Store */}
      <div className="glass-card rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white flex items-center gap-2">🎨 IDE Themes</h2>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">Your Balance: {xpData?.currentXp ?? 0} XP</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'vs-dark', name: 'Default Dark', price: 0, colors: ['#1e1e1e', '#d4d4d4', '#569cd6'] },
            { id: 'dracula', name: 'Dracula', price: 100, colors: ['#282a36', '#f8f8f2', '#ff79c6'] },
            { id: 'monokai', name: 'Monokai', price: 150, colors: ['#272822', '#f8f8f2', '#a6e22e'] },
            { id: 'synthwave', name: 'Synthwave 84', price: 300, colors: ['#262335', '#ff7edb', '#36f9f6'] }
          ].map(theme => {
            const unlockedThemes = user?.unlockedThemes ? JSON.parse(user.unlockedThemes) : []
            const isUnlocked = theme.id === 'vs-dark' || unlockedThemes.includes(theme.id)
            const isActive = currentIdeTheme === theme.id

            return (
            <div key={theme.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isUnlocked ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 grayscale'}`}>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 rounded overflow-hidden">
                  {theme.colors.map(c => <div key={c} style={{ backgroundColor: c }} className="w-2 h-6" />)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{theme.name}</h3>
                  <p className="text-[10px] text-slate-400">{theme.price === 0 ? 'Free' : `${theme.price} XP`}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleThemeAction(theme)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  isUnlocked 
                    ? isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white hover:bg-white/10'
                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                {isUnlocked ? (isActive ? 'Active' : 'Apply') : 'Unlock'}
              </button>
            </div>
            )
          })}
        </div>
      </div>

      {/* Danger */}
      <div className="glass-card rounded-2xl p-6 border border-red-500/10">
        <h2 className="font-bold text-white mb-4">⚠️ Account</h2>
        <p className="text-sm text-slate-400 mb-4">Sign out of your Programmer Learner account on this device.</p>
        <button onClick={logout}
          className="rounded-xl border border-red-500/20 px-5 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )
}

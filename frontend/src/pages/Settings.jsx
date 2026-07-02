import { useState } from 'react'
import { useStore } from '../store/useStore'
import api from '../api/client'

export default function Settings() {
  const user = useStore(s => s.user)
  const setUser = useStore(s => s.setUser)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

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
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-2xl font-black text-white shadow-lg">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </span>
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

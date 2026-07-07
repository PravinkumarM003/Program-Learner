import { useEffect } from 'react'
import { useStore } from '../store/useStore'

const ICONS = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
  error:   { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   text: '#f87171' },
  info:    { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
  warning: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24' },
}

export default function Toast() {
  const toast = useStore(s => s.toast)
  const clearToast = useStore(s => s.clearToast)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3500)
      return () => clearTimeout(timer)
    }
  }, [toast, clearToast])

  if (!toast) return null

  const c = COLORS[toast.type] || COLORS.info
  const icon = ICONS[toast.type] || ICONS.info

  return (
    <div
      key={toast.id}
      className="fixed top-5 right-5 z-[9999] max-w-sm animate-toast-in"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '16px',
        padding: '14px 20px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-relaxed" style={{ color: c.text }}>
            {toast.msg}
          </p>
        </div>
        <button
          onClick={clearToast}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
          style={{ color: c.text }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

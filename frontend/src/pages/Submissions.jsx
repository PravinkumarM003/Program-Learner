import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useStore } from '../store/useStore'
import api from '../api/client'

const STATUS_MAP = {
  Pending:     { cls: 'badge badge-pending',  icon: '⏳', label: 'Pending' },
  UnderReview: { cls: 'badge badge-review',   icon: '🔍', label: 'Under Review' },
  Accepted:    { cls: 'badge badge-accepted', icon: '✅', label: 'Accepted' },
  Rejected:    { cls: 'badge badge-rejected', icon: '❌', label: 'Rejected' },
}

export default function Submissions() {
  const theme = useStore(s => s.theme)
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/submissions')
      .then(r => setSubs(r.data?.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      
      {/* ── Header ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Your History</p>
          <h1 className="text-3xl font-black text-white">My Submissions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track your solutions and read instructor feedback
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
           <span className="text-2xl">📝</span>
           <div>
             <p className="text-xs text-slate-400">Total Submissions</p>
             <p className="font-bold text-white leading-tight">{subs.length}</p>
           </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      )}

      {!loading && subs.length === 0 && (
        <div className="glass-card rounded-2xl p-14 text-center animate-fade-in">
          <p className="text-5xl mb-4 block">📭</p>
          <p className="text-lg font-bold text-white mb-2">No submissions yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Solve a task and submit your code to get started.
          </p>
          <Link to="/tasks" className="btn-primary text-sm px-6 py-2.5">Browse Tasks →</Link>
        </div>
      )}

      {!loading && subs.length > 0 && (
        <div className="space-y-4 stagger">
          {subs.map(s => {
            const st = STATUS_MAP[s.status] || { cls: 'badge', icon: '❓', label: s.status }
            const latestCode = s.versions?.length > 0 ? s.versions[s.versions.length - 1].code : null
            const lang = s.task?.type === 'CODE' ? 'python' : 'plaintext'
            const isExpanded = selected?.id === s.id

            return (
              <div key={s.id}
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 animate-fade-up ${isExpanded ? 'ring-1 ring-cyan-500/30' : 'hover:border-white/10'}`}>
                
                {/* ── Row Header ── */}
                <div onClick={() => setSelected(isExpanded ? null : s)}
                  className={`flex items-center justify-between gap-4 flex-wrap p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}>
                      {st.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-base truncate leading-tight">{s.task?.title || 'Task'}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Submitted {new Date(s.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {s.earnedXp > 0 && <span className="text-xs font-bold text-amber-400">⚡+{s.earnedXp}</span>}
                    {s.marks != null && <span className="text-sm font-bold text-cyan-400">{s.marks} pts</span>}
                    <span className={st.cls}>{st.label}</span>
                    <span className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* ── Expanded Content ── */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="p-5 pt-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      
                      {/* Feedback */}
                      {s.feedback && (
                        <div className="mt-5 rounded-xl p-4 flex gap-3 animate-fade-in"
                          style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.1), rgba(139,92,246,0.02))', borderLeft: '4px solid #8b5cf6' }}>
                          <span className="text-xl shrink-0">💬</span>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-1">Instructor Feedback</p>
                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{s.feedback}</p>
                          </div>
                        </div>
                      )}

                      {/* Code Snippet */}
                      {latestCode && s.task?.type === 'CODE' ? (
                        <div className="mt-5 rounded-xl overflow-hidden animate-fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
                          <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-overlay)' }}>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted Code</p>
                            <span className="text-[10px] text-slate-500">{lang}</span>
                          </div>
                          <Editor
                            height="250px"
                            language={lang}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            value={latestCode}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              padding: { top: 16, bottom: 16 },
                              fontFamily: '"Fira Code", monospace',
                            }}
                          />
                        </div>
                      ) : (
                        latestCode && (
                          <div className="mt-5 animate-fade-in">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Submitted Answer</p>
                             <pre className="text-sm rounded-xl p-5 overflow-auto max-h-64 font-mono whitespace-pre-wrap"
                               style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                               {latestCode}
                             </pre>
                          </div>
                        )
                      )}

                      {/* Footer Actions */}
                      <div className="mt-5 flex items-center justify-end">
                         <Link to={`/tasks/${s.taskId}`} className="btn-ghost text-xs px-4 py-2">
                           View Task →
                         </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

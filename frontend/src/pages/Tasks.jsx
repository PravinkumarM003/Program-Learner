import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const DIFF_CONFIG = {
  Beginner:     { cls: 'badge badge-accepted', bar: 'bg-emerald-500', width: '33%' },
  Intermediate: { cls: 'badge badge-pending',  bar: 'bg-amber-500',   width: '66%' },
  Advanced:     { cls: 'badge badge-rejected', bar: 'bg-red-500',     width: '100%' },
}

const TYPE_CONFIG = {
  CODE:    { cls: 'badge badge-code',    icon: '💻', label: 'Code' },
  QUIZ:    { cls: 'badge badge-quiz',    icon: '❓', label: 'Quiz' },
  GENERAL: { cls: 'badge badge-general', icon: '📝', label: 'General' },
}

const FILTERS = ['All', 'CODE', 'QUIZ', 'GENERAL', 'Beginner', 'Intermediate', 'Advanced']

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [submittedTaskIds, setSubmittedTaskIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/submissions').catch(() => ({ data: { submissions: [] } }))
    ])
      .then(([tRes, sRes]) => {
        setTasks(tRes.data?.tasks || [])
        setSubmittedTaskIds(new Set((sRes.data?.submissions || []).map(s => s.taskId)))
      })
      .catch(() => setError('Could not load tasks.'))
      .finally(() => setLoading(false))
  }, [])

  const typeFilters  = ['All', 'CODE', 'QUIZ', 'GENERAL']
  const diffFilters  = ['Beginner', 'Intermediate', 'Advanced']

  const filterTasks = (t) => {
    if (!showDone && submittedTaskIds.has(t.id)) return false
    if (filter === 'All') return true
    if (typeFilters.includes(filter)) return t.type === filter
    if (diffFilters.includes(filter)) return t.difficulty === filter
    return true
  }
  const filtered = tasks.filter(filterTasks)
  const doneCount = tasks.filter(t => submittedTaskIds.has(t.id)).length

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

      {/* ── Header ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-1">Challenges</p>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            Tasks
            <span className="text-sm font-bold px-2.5 py-1 rounded-full text-cyan-400"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
              {filtered.length}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Solve coding challenges and get reviewed by instructors
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'CODE', 'QUIZ', 'GENERAL'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                {f === 'All' ? 'All Types' : (TYPE_CONFIG[f]?.icon + ' ' + TYPE_CONFIG[f]?.label)}
              </button>
            ))}
          </div>
          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Beginner', 'Intermediate', 'Advanced'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Show done toggle */}
      {doneCount > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowDone(s => !s)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              showDone
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-500 border-white/10 hover:text-white hover:bg-white/5'
            }`}>
            <span>{showDone ? '✅' : '○'}</span>
            Show completed ({doneCount})
          </button>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-14 text-center animate-fade-in">
          <span className="text-5xl block mb-4">🎯</span>
          <p className="font-bold text-white text-lg mb-2">
            {doneCount > 0 && !showDone ? 'All caught up!' : `No "${filter}" tasks found`}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {doneCount > 0 && !showDone
              ? 'You\'ve completed all available tasks in this category.'
              : 'Try a different filter to discover more challenges.'}
          </p>
          {doneCount > 0 && !showDone && (
            <button onClick={() => setShowDone(true)} className="btn-primary text-sm px-5 py-2">
              Show completed tasks
            </button>
          )}
        </div>
      )}

      {/* ── Tasks grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-10">
          {['C', 'Python', 'Other'].map(categoryGroup => {
            const catTasks = filtered.filter(t => {
              const cat = t.category?.toLowerCase() || 'c';
              if (categoryGroup === 'Python') return cat === 'python';
              if (categoryGroup === 'C') return cat === 'c';
              return !['python', 'c'].includes(cat);
            });

            if (catTasks.length === 0) return null;

            const dividerColor = categoryGroup === 'C'
              ? 'bg-cyan-500/40'
              : categoryGroup === 'Python'
              ? 'bg-violet-500/40'
              : 'bg-white/10'
            const labelColor = categoryGroup === 'C'
              ? 'text-cyan-400'
              : categoryGroup === 'Python'
              ? 'text-violet-400'
              : 'text-slate-400'
            const icon = categoryGroup === 'C' ? '🖥️' : categoryGroup === 'Python' ? '🐍' : '📝'
            const label = categoryGroup === 'Other' ? 'General' : categoryGroup

            return (
              <div key={categoryGroup}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-px flex-1 ${dividerColor}`}></div>
                  <span className={`flex items-center gap-2 font-black tracking-wider uppercase text-sm px-3 py-1 rounded-full border ${
                    categoryGroup === 'C'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : categoryGroup === 'Python'
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    <span>{icon}</span> {label}
                  </span>
                  <div className={`h-px flex-1 ${dividerColor}`}></div>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                  {catTasks.map(t => {
                    const done = submittedTaskIds.has(t.id)
                    const type = TYPE_CONFIG[t.type] || { cls: 'badge', icon: '📄', label: t.type }
                    const diff = DIFF_CONFIG[t.difficulty] || { cls: 'badge', bar: 'bg-slate-500', width: '50%' }
                    return (
                      <Link key={t.id} to={`/tasks/${t.id}`}
                        onClick={(e) => { if (done) e.preventDefault() }}
                        className={`card-hover glass-card rounded-2xl p-6 flex flex-col gap-4 group relative overflow-hidden animate-fade-up gradient-border ${done ? 'opacity-70 cursor-default' : ''}`}>
                        
                        {/* Done overlay badge */}
                        {done && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="badge badge-accepted">✓ Done</span>
                          </div>
                        )}

                        {/* Type + XP row */}
                        <div className="flex items-start justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}>
                            {type.icon}
                          </span>
                          {t.baseXp > 0 && (
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              ⚡ {t.baseXp} XP
                            </span>
                          )}
                        </div>

                        {/* Title & description */}
                        <div className="flex-1">
                          <h2 className="font-bold text-white text-base leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2 mb-1.5">
                            {t.title}
                          </h2>
                          {t.description && (
                            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        {/* Difficulty bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={type.cls}>{type.label}</span>
                            <span className={diff.cls}>{t.difficulty}</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${diff.bar}`} style={{ width: diff.width }} />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs border-t pt-3" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                          {t.deadline
                            ? <span>⏰ Due {new Date(t.deadline).toLocaleDateString()}</span>
                            : <span>{t.submissions?.length ?? 0} submissions</span>
                          }
                          <span className="text-cyan-400 group-hover:translate-x-1 transition-transform inline-block font-bold">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

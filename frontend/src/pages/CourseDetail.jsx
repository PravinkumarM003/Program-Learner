import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useStore } from '../store/useStore'

const DIFF_COLOR = {
  Beginner: 'bg-green-500/10 text-green-400',
  Intermediate: 'bg-yellow-500/10 text-yellow-400',
  Advanced: 'bg-red-500/10 text-red-400',
}

const TASK_DIFF_CONFIG = {
  Beginner:     { cls: 'badge badge-accepted', bar: 'bg-emerald-500', width: '33%' },
  Intermediate: { cls: 'badge badge-pending',  bar: 'bg-amber-500',   width: '66%' },
  Advanced:     { cls: 'badge badge-rejected', bar: 'bg-red-500',     width: '100%' },
}

const TYPE_CONFIG = {
  CODE:    { cls: 'badge badge-code',    icon: '💻', label: 'Code' },
  QUIZ:    { cls: 'badge badge-quiz',    icon: '❓', label: 'Quiz' },
  GENERAL: { cls: 'badge badge-general', icon: '📝', label: 'General' },
}

export default function CourseDetail() {
  const { id } = useParams()
  const user = useStore(s => s.user)
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState([]) // array of LessonProgress objects
  const [submittedTaskIds, setSubmittedTaskIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`).then(r => setCourse(r.data?.course)),
      api.get('/progress').then(r => setProgress(r.data?.progress || [])).catch(() => {}),
      api.get('/submissions').then(r => setSubmittedTaskIds(new Set((r.data?.submissions || []).map(s => s.taskId)))).catch(() => {})
    ])
      .catch(() => setError('Course not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <div className="h-10 w-64 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-4 w-96 rounded-lg bg-white/5 animate-pulse" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  )

  if (error || !course) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-slate-400">{error || 'Course not found.'}</p>
      <Link to="/courses" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">← Back to Lessons</Link>
    </div>
  )

  const totalLessons = course.lessons?.length ?? 0

  // Build a lookup map: lessonId -> progress object
  const progressMap = Object.fromEntries(progress.map(p => [p.lessonId, p]))

  const completedCount = (course.lessons || []).filter(l => progressMap[l.id]?.completed).length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const totalXpEarned = (course.lessons || []).reduce((sum, l) => sum + (progressMap[l.id]?.xp || 0), 0)

  const downloadCertificate = useCallback(() => {
    setDownloading(true)
    const studentName = user?.name || user?.email || 'Student'
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Certificate - ${course.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .cert { width: 900px; min-height: 620px; border: 12px solid #06b6d4; border-radius: 24px; padding: 60px 80px; text-align: center; position: relative; background: linear-gradient(135deg,#f0fdfa,#eff6ff); }
  .cert::before { content: ''; position: absolute; inset: 16px; border: 2px dashed #a5f3fc; border-radius: 14px; pointer-events: none; }
  .logo { font-size: 48px; margin-bottom: 8px; }
  .brand { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #0891b2; font-weight: 600; margin-bottom: 40px; }
  .cert-title { font-family: 'Playfair Display', serif; font-size: 42px; color: #0c4a6e; margin-bottom: 12px; }
  .sub { font-size: 16px; color: #64748b; margin-bottom: 36px; }
  .name { font-family: 'Playfair Display', serif; font-size: 52px; color: #0891b2; border-bottom: 3px solid #0891b2; display: inline-block; padding-bottom: 8px; margin-bottom: 28px; }
  .course-label { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
  .course-name { font-size: 26px; font-weight: 700; color: #1e293b; margin-bottom: 40px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
  .footer-item { text-align: center; }
  .footer-item .value { font-weight: 700; font-size: 15px; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 6px; }
  .footer-item .label { font-size: 11px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .xp { background: linear-gradient(135deg,#f59e0b,#ef4444); color: white; font-size: 15px; font-weight: 700; padding: 8px 20px; border-radius: 999px; display: inline-block; margin-bottom: 20px; }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">💻</div>
  <div class="brand">Programmer Learner</div>
  <div class="cert-title">Certificate of Completion</div>
  <div class="sub">This is to certify that</div>
  <div class="name">${studentName}</div>
  <div class="course-label">has successfully completed</div>
  <div class="course-name">${course.title}</div>
  ${totalXpEarned > 0 ? `<div class="xp">⚡ ${totalXpEarned} XP Earned</div>` : ''}
  <div class="footer">
    <div class="footer-item"><div class="value">${completedCount} Lessons</div><div class="label">Completed</div></div>
    <div class="footer-item"><div class="value">Programmer Learner</div><div class="label">Platform</div></div>
    <div class="footer-item"><div class="value">${date}</div><div class="label">Issue Date</div></div>
  </div>
</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Certificate_${course.title.replace(/\s+/g,'_')}.html`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDownloading(false), 1000)
  }, [course, user, completedCount, totalXpEarned])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/courses" className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-flex items-center gap-1">
        ← All Lessons
      </Link>

      <div className="glass-card rounded-3xl p-8 mb-8">
        <span className="text-4xl">🐍</span>
        <h1 className="mt-4 text-3xl font-black text-white">{course.title}</h1>
        {course.description && <p className="mt-3 text-slate-400 leading-relaxed">{course.description}</p>}

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span>📖 {totalLessons} lessons</span>
          <span>🗓 Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
          {totalXpEarned > 0 && <span className="text-yellow-400 font-semibold">⚡ {totalXpEarned} XP earned</span>}
        </div>

        {/* Progress bar */}
        {totalLessons > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-semibold text-cyan-400">{completedCount} / {totalLessons} complete · {progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressPct === 100 && (
              <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20">
                <div>
                  <p className="font-bold text-green-400 text-sm">🎉 Course Complete!</p>
                  <p className="text-xs text-slate-400 mt-0.5">You finished all {totalLessons} lessons. Claim your certificate!</p>
                </div>
                <button onClick={downloadCertificate} disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
                  {downloading ? '⏳ Generating...' : '🏅 Download Certificate'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="font-bold text-white mb-4">Lessons</h2>
      {course.lessons?.length ? (
        <div className="space-y-3">
          {course.lessons.map((l, idx) => {
            const prog = progressMap[l.id]
            const done = prog?.completed
            const xp = prog?.xp || 0
            return (
              <Link key={l.id} to={`/lessons/${l.id}`}
                className="card-hover glass-card rounded-2xl px-6 py-4 flex items-center gap-4 group">

                {/* Number or check */}
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors
                  ${done
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-white/5 text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400'
                  }`}>
                  {done ? '✓' : idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium transition-colors truncate ${done ? 'text-slate-400' : 'text-white group-hover:text-cyan-400'}`}>
                    {l.title}
                  </p>
                  {done && xp > 0 && (
                    <p className="text-xs text-yellow-500 mt-0.5">⚡ {xp} XP earned</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {l.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${DIFF_COLOR[l.difficulty] || 'bg-white/10 text-slate-400'}`}>
                      {l.difficulty}
                    </span>
                  )}
                  {done && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-medium">Done</span>
                  )}
                  <span className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center text-slate-600">
          <p className="text-3xl mb-2">🚧</p>
          <p>Lessons coming soon!</p>
        </div>
      )}

      {/* Tasks Section */}
      <div className="mt-12">
        <h2 className="font-bold text-white mb-4">Tasks</h2>
        {course.tasks?.length ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {course.tasks.map(t => {
              const done = submittedTaskIds.has(t.id)
              const type = TYPE_CONFIG[t.type] || { cls: 'badge', icon: '📄', label: t.type }
              const diff = TASK_DIFF_CONFIG[t.difficulty] || { cls: 'badge', bar: 'bg-slate-500', width: '50%' }
              return (
                <Link key={t.id} to={`/tasks/${t.id}`}
                  className={`card-hover glass-card rounded-2xl p-5 flex flex-col gap-4 group relative overflow-hidden animate-fade-up gradient-border ${done ? 'opacity-70' : ''}`}>
                  
                  {done && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="badge badge-accepted">✓ Done</span>
                    </div>
                  )}

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

                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2 mb-1.5">
                      {t.title}
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={type.cls}>{type.label}</span>
                      <span className={diff.cls}>{t.difficulty}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${diff.bar}`} style={{ width: diff.width }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center text-slate-600">
            <p className="text-3xl mb-2">🎯</p>
            <p>No tasks available for this course yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

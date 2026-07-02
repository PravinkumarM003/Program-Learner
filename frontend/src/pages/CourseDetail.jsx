import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

const DIFF_COLOR = {
  Beginner: 'bg-green-500/10 text-green-400',
  Intermediate: 'bg-yellow-500/10 text-yellow-400',
  Advanced: 'bg-red-500/10 text-red-400',
}

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState([]) // array of LessonProgress objects
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`).then(r => setCourse(r.data?.course)),
      api.get('/progress').then(r => setProgress(r.data?.progress || [])).catch(() => {}),
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
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

function readingTime(text) {
  const words = (text || '').trim().split(/\s+/).length
  const mins = Math.max(1, Math.round(words / 200))
  return mins === 1 ? '1 min read' : `${mins} min read`
}

// XP Toast component
function XpToast({ xp, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-6 py-4 shadow-xl backdrop-blur-sm">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-sm font-bold text-yellow-400">+{xp} XP Earned!</p>
          <p className="text-xs text-slate-400">Lesson completed</p>
        </div>
      </div>
    </div>
  )
}

export default function LessonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [allLessons, setAllLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Completion state (pre-loaded from API)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [marked, setMarked] = useState(false)
  const [marking, setMarking] = useState(false)

  // XP toast
  const [toastXp, setToastXp] = useState(null)

  useEffect(() => {
    setLoading(true)
    setMarked(false)
    setAlreadyCompleted(false)
    setToastXp(null)

    api.get(`/lessons/${id}`)
      .then(async r => {
        const l = r.data?.lesson
        setLesson(l)

        // Fetch course + all its lessons for Next Lesson navigation
        if (l?.courseId) {
          const promises = [api.get(`/courses/${l.courseId}`).catch(() => null)]
          const token = localStorage.getItem('access_token')
          if (token) {
            promises.push(api.get('/progress').catch(() => null))
            promises.push(api.get('/submissions').catch(() => null))
          }
          
          const results = await Promise.all(promises)
          const courseRes = results[0]
          const progressRes = token ? results[1] : null

          if (courseRes?.data?.course) {
            setCourse(courseRes.data.course)
            const sorted = [...(courseRes.data.course.lessons || [])].sort((a, b) => a.order - b.order)
            setAllLessons(sorted)
          }
          if (progressRes?.data?.progress) {
            const prog = progressRes.data.progress.find(p => p.lessonId === id)
            if (prog?.completed) {
              setAlreadyCompleted(true)
              setMarked(true)
            }
          }
        }
      })
      .catch(() => setError('Lesson not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const markComplete = () => {
    setMarking(true)
    api.post(`/lessons/${id}/complete`)
      .then(r => {
        setMarked(true)
        const xp = r.data?.xp || r.data?.progress?.xp
        if (xp && xp > 0) setToastXp(xp)
      })
      .catch(() => setMarked(true)) // still mark in UI even if API fails
      .finally(() => setMarking(false))
  }

  // Next lesson in the same course
  const currentIdx = allLessons.findIndex(l => l.id === id)
  const nextLesson = currentIdx >= 0 && currentIdx < allLessons.length - 1
    ? allLessons[currentIdx + 1]
    : null

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
    </div>
  )

  if (error || !lesson) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-slate-400">{error || 'Lesson not found.'}</p>
      <Link to="/courses" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">← Back to Courses</Link>
    </div>
  )

  const isCompleted = marked || alreadyCompleted

  // Progress in course
  const totalLessons = allLessons.length
  const lessonNum = currentIdx + 1

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {toastXp && <XpToast xp={toastXp} onDone={() => setToastXp(null)} />}

      {/* Breadcrumb */}
      <Link to={course ? `/courses/${lesson.courseId}` : '/courses'}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-flex items-center gap-1">
        ← {course ? course.title : 'Back to Course'}
      </Link>

      {/* Course progress mini-bar */}
      {totalLessons > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Lesson {lessonNum} of {totalLessons}</span>
            <span className="text-xs text-slate-500">{course?.title}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all duration-500"
              style={{ width: `${(lessonNum / totalLessons) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card rounded-3xl p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {lesson.difficulty && (
            <span className="text-xs px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-medium">{lesson.difficulty}</span>
          )}
          <span className="text-xs text-slate-500">Lesson {lesson.order}</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">⏱ {readingTime(lesson.content)}</span>
          {isCompleted && (
            <span className="ml-auto text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-medium">✓ Completed</span>
          )}
        </div>
        <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
      </div>

      {/* Video Embed */}
      {lesson.videoUrl && (() => {
        const isYoutube = /youtube\.com|youtu\.be/.test(lesson.videoUrl)
        let embedUrl = lesson.videoUrl
        if (isYoutube) {
          // Convert youtube.com/watch?v=ID or youtu.be/ID → embed URL
          const idMatch = lesson.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
          if (idMatch) embedUrl = `https://www.youtube.com/embed/${idMatch[1]}?rel=0&modestbranding=1`
        }

        return isYoutube ? (
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <span className="text-red-500 text-sm">▶</span>
              <p className="text-xs font-bold text-white">Video Lesson</p>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-4 flex items-center gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <p className="text-xs font-bold text-violet-400 mb-0.5">External Resource</p>
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:underline break-all">{lesson.videoUrl}</a>
            </div>
          </div>
        )
      })()}

      {/* Content */}
      <div className="glass-card rounded-2xl p-8 mb-6">
        <h2 className="font-bold text-white mb-4">📖 Content</h2>
        <div className="prose-content text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{lesson.content}</div>
      </div>

      {/* Notes */}
      {lesson.notes && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 mb-6">
          <h2 className="font-bold text-cyan-400 mb-3">💡 Notes</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{lesson.notes}</p>
        </div>
      )}


      {/* Footer actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link to="/courses" className="text-sm text-slate-400 hover:text-white transition-colors">← All Courses</Link>

        <div className="flex items-center gap-3">
          {/* Complete button */}
          {isCompleted ? (
            <span className="flex items-center gap-2 rounded-xl bg-green-500/10 px-5 py-2.5 text-sm font-semibold text-green-400">
              ✓ Completed!
            </span>
          ) : (
            <button onClick={markComplete} disabled={marking}
              className="btn-glow rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50">
              {marking ? 'Saving…' : 'Mark as Complete'}
            </button>
          )}

          {/* Next lesson button */}
          {nextLesson && (
            <Link to={`/lessons/${nextLesson.id}`}
              className="btn-glow rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5">
              Next Lesson →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

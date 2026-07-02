import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const DIFF_COLOR = { Beginner: 'text-green-400', Intermediate: 'text-yellow-400', Advanced: 'text-red-400' }

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data?.courses || [])).catch(() => setError('Could not load courses.')).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Lessons</h1>
        <p className="text-slate-400 mt-1">Pick a course and start learning programming</p>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-slate-400">{error}</p>
          <p className="text-xs text-slate-600 mt-2">Make sure the backend is running.</p>
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-slate-400">No courses yet. Check back soon!</p>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`}
              className="card-hover glass-card rounded-2xl p-6 flex flex-col gap-3 group">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🐍</span>
                <span className="text-xs text-slate-500">{c.lessons?.length ?? 0} lessons</span>
              </div>
              <h2 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{c.title}</h2>
              {c.description && <p className="text-sm text-slate-400 line-clamp-2">{c.description}</p>}
              <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>Updated {new Date(c.updatedAt).toLocaleDateString()}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

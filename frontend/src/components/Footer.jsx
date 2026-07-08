import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="flex items-center gap-2 justify-center">
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-white font-black text-xs"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>PL</span>
          <span className="text-sm font-semibold text-white">Programmer Learner</span>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Programmer Learner. All rights reserved. Built with ❤️ for developers.
        </p>
        <div className="flex gap-4 text-xs text-slate-500 justify-center">
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/courses" className="hover:text-white transition-colors">Lessons</Link>
          <Link to="/tasks" className="hover:text-white transition-colors">Tasks</Link>
        </div>
      </div>
    </footer>
  )
}

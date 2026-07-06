import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useEffect, useState, useCallback } from 'react';
import api from './api/client';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonDetail from './pages/LessonDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Submissions from './pages/Submissions';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import About from './pages/About';
import Playground from './pages/Playground';


function PrivateRoute({ children, role, allowGuest = false }) {
  const user = useStore(s => s.user);
  if (allowGuest) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { theme } = useStore(s => ({ theme: s.theme }));
  const { setUser } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchUser = useCallback(() => {
    api.get('/user/me')
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading Programmer Learner…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? "min-h-screen bg-slate-950 text-white" : "min-h-screen bg-white text-slate-950"}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          <Route path="/" element={ <Landing /> } />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
          <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
          <Route path="/lessons/:id" element={<PrivateRoute><LessonDetail /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
          <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/playground" element={<PrivateRoute><Playground /></PrivateRoute>} />

          <Route path="*" element={
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
              <p className="text-8xl font-black text-slate-800">404</p>
              <p className="text-xl text-slate-400">Page not found</p>
              <a href="/" className="btn-glow mt-2 rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950">Go home</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import api from './api/client';
import Navbar from './components/Navbar';
import StreakPopup from './components/StreakPopup';
import Toast from './components/Toast';
import AchievementPopup from './components/AchievementPopup';

// ── Lazy-loaded pages (only download when first visited) ──────────────────────
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Courses        = lazy(() => import('./pages/Courses'))
const CourseDetail   = lazy(() => import('./pages/CourseDetail'))
const LessonDetail   = lazy(() => import('./pages/LessonDetail'))
const Tasks          = lazy(() => import('./pages/Tasks'))
const TaskDetail     = lazy(() => import('./pages/TaskDetail'))
const Submissions    = lazy(() => import('./pages/Submissions'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Settings       = lazy(() => import('./pages/Settings'))
const Leaderboard    = lazy(() => import('./pages/Leaderboard'))
const About          = lazy(() => import('./pages/About'))
const Playground     = lazy(() => import('./pages/Playground'))
const OAuthCallback  = lazy(() => import('./pages/OAuthCallback'))

// Lightweight full-page loading spinner shown while a chunk is downloading
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
    </div>
  )
}


function PrivateRoute({ children, role, allowedRoles, allowGuest = false }) {
  const user = useStore(s => s.user);
  if (allowGuest) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const theme = useStore(s => s.theme);
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
    <div className={theme === 'dark' ? "min-h-screen bg-slate-950 text-white" : "min-h-screen bg-white text-slate-950"}
      style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toast />
        <StreakPopup />
        <AchievementPopup />
        <Navbar />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={ <Landing /> } />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
          <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
          <Route path="/lessons/:id" element={<PrivateRoute><LessonDetail /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
          <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMIN', 'TEACHER']}><AdminDashboard /></PrivateRoute>} />
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
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import api from '../api/client'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    // Extract tokens from the hash fragment, e.g., #access_token=...&refresh_token=...
    const hash = location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      // Fetch the user to confirm login and update state
      api.get('/user/me')
        .then(r => {
          setUser(r.data.user)
          navigate('/dashboard', { replace: true })
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          navigate('/login', { replace: true })
        })
    } else {
      navigate('/login', { replace: true })
    }
  }, [location, navigate, setUser])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-sm font-semibold">Completing authentication...</p>
      </div>
    </div>
  )
}

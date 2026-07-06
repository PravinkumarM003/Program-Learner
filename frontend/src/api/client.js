import axios from 'axios'
import { useStore } from '../store/useStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://program-learner.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
})

// ─── Request Interceptor: attach Bearer token ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor: refresh token on 401 ──────────────────────────────
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Avoid infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    // Only handle 401 for non-auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    
    if (status === 401 && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            originalRequest._retry = true
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token available')

        const res = await axios.post(
          `${BASE_URL.replace('/api', '')}/api/auth/refresh`,
          { refresh_token: refresh }
        )
        
        const newAccess = res.data.access_token
        const newRefresh = res.data.refresh_token
        
        localStorage.setItem('access_token', newAccess)
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh)
        }
        
        isRefreshing = false
        onRefreshed(newAccess)
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        
        // Full session expiry — clear state and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        useStore.getState().clearUser()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

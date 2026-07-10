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
  (response) => {
    // Cache GET response data under a unique localStorage key
    if (response.config.method === 'get') {
      try {
        localStorage.setItem(`api_cache_${response.config.url}`, JSON.stringify(response.data))
      } catch (e) {
        console.warn('Failed to cache response:', e)
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Check if network is offline or request timed out
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error'
    if (originalRequest && originalRequest.method === 'get' && isNetworkError) {
      const cacheKey = `api_cache_${originalRequest.url}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          const showToast = useStore.getState().showToast
          if (showToast) {
            showToast('Offline or slow internet detected. Displaying cached data.', 'info')
          }
          return {
            data: parsed,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: originalRequest
          }
        } catch (e) {}
      }
    }

    // Avoid infinite retry loops
    if (originalRequest && originalRequest._retry) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    // Only handle 401 for non-auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
    
    if (status === 401 && !isAuthEndpoint && originalRequest) {
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
        
        // Full session expiry — clear state
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        useStore.getState().clearUser()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

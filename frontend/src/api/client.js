import axios from 'axios'
import { useStore } from '../store/useStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// ─── CSRF Token Cache ────────────────────────────────────────────────────────
let csrfToken = null
let csrfFetchPromise = null

async function fetchCsrfToken() {
  // If already fetching, wait for the same promise (avoid parallel fetches)
  if (csrfFetchPromise) return csrfFetchPromise
  csrfFetchPromise = axios
    .get(`${BASE_URL.replace('/api', '')}/api/csrf-token`, { withCredentials: true })
    .then((r) => {
      csrfToken = r.data?.csrfToken || null
      csrfFetchPromise = null
      return csrfToken
    })
    .catch(() => {
      csrfFetchPromise = null
      return null
    })
  return csrfFetchPromise
}

// ─── Request Interceptor: attach CSRF token on mutations ─────────────────────
api.interceptors.request.use(async (config) => {
  const method = (config.method || '').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    if (!csrfToken) {
      await fetchCsrfToken()
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  return config
})

// ─── Response Interceptor: refresh token on 401 ──────────────────────────────
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb())
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
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(() => {
            originalRequest._retry = true
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Fetch fresh CSRF token for the refresh call
        const freshCsrf = await fetchCsrfToken()
        await axios.post(
          `${BASE_URL.replace('/api', '')}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: freshCsrf ? { 'X-CSRF-Token': freshCsrf } : {},
          }
        )
        // Invalidate cached CSRF token after rotation (cookies changed)
        csrfToken = null
        isRefreshing = false
        onRefreshed()
        // Retry original request with new tokens
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        csrfToken = null
        // Full session expiry — clear state and redirect to login
        useStore.getState().clearUser()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // On 403, the CSRF token may have been invalidated — clear cached token
    if (status === 403 && error.response?.data?.error?.includes('CSRF')) {
      csrfToken = null
    }

    return Promise.reject(error)
  }
)

export default api

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register Service Worker for offline/low-internet support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[SW] Registered:', reg.scope)

        // Check for new SW updates every 30 minutes
        setInterval(() => reg.update(), 30 * 60 * 1000)

        // Listen for messages from the SW (e.g., RETRY_QUEUED_REQUESTS)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'RETRY_QUEUED_REQUESTS') {
            // Re-trigger pending API calls stored in the app
            window.dispatchEvent(new CustomEvent('sw-retry-queued'))
          }
        })
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}

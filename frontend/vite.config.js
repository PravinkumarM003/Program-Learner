import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Monaco editor is huge (~5 MB) — give it its own chunk so it only
          // loads on the Playground page. All other node_modules stay in ONE
          // vendor chunk to guarantee a single React instance and avoid the
          // "Cannot read properties of undefined (reading 'useState')" error
          // that occurs when react-dependent packages (zustand, framer-motion,
          // react-router) are split into a separate chunk that evaluates before
          // react/react-dom is ready.
          if (id.includes('node_modules')) {
            if (id.includes('monaco-editor')) return 'monaco-editor'
            return 'vendor'
          }
        }
      }
    }
  },
  // Prevent Vite from pre-bundling Monaco workers (they use ?worker syntax)
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  worker: {
    format: 'es'
  }
})


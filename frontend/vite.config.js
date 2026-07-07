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
    // Warn if any single chunk exceeds 600 KB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Monaco editor gets its own huge chunk (loaded only on Playground page)
          if (id.includes('monaco-editor')) return 'monaco-editor'
          // React core — tiny, always needed
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
          // Router
          if (id.includes('react-router')) return 'router'
          // Everything else from node_modules in one vendor chunk
          if (id.includes('node_modules')) return 'vendor'
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

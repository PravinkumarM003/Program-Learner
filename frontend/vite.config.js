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
    rollupOptions: {
      output: {
        // Give Monaco workers their own chunks
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
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


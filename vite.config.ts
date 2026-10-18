import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Standalone web build of the renderer — used for the live preview and for
// embedding Taraz as a web app. The Electron build uses electron.vite.config.ts.
export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true
  },
  build: {
    outDir: '../../out/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Standalone web build of the renderer — the live preview, and the same UI the
// Electron shell loads. The desktop build uses electron.vite.config.ts.
export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url)),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: true,
    allowedHosts: true
  },
  build: {
    outDir: '../../out/web',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000
  }
})

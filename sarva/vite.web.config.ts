/**
 * پیش‌نمایشِ وبِ موقت (فقط برای توسعه).
 *
 * `electron-vite dev` یک پنجره‌ی الکترون باز می‌کند که در سندباکس دیده
 * نمی‌شود؛ این کانفیگ همان تنظیماتِ `renderer` را به یک سرورِ معمولیِ روی
 * `0.0.0.0` می‌دهد تا صفحه‌ها پیش‌نمایش شوند. فایلِ ساخت (`vite.config.ts`)
 * را لمس نمی‌کند.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: 'src/renderer',
  publicDir: '../../public',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
  build: { chunkSizeWarningLimit: 2000 },
})

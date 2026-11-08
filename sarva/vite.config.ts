import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Standalone web build of the renderer — the live preview, and the same UI the
// Electron shell loads. The desktop build uses electron.vite.config.ts.
export default defineConfig({
  root: 'src/renderer',
  /* ⚠️ دارایی‌ها بیرون از `root` زندگی می‌کنند (`sarva/public`): تصویرهای
     شعر، واژه، بازی و خط‌زمان — روی هم بیش از ۳۰۰ مگابایت — با
     `scripts/fetch-assets.mjs` آنجا ریخته می‌شوند و در گیت نمی‌آیند.
     پیش‌فرضِ vite `<root>/public` است، یعنی `src/renderer/public` که اصلاً
     وجود ندارد؛ بی‌این خط هر تصویرِ برنامه یک لینکِ شکسته بود.
     مسیر نسبی به `root` است، پس `../../public` یعنی همان پوشهٔ پروژه. */
  publicDir: '../../public',
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

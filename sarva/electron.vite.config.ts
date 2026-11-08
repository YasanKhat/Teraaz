import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: 'src/main/index.ts' } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { rollupOptions: { input: 'src/preload/index.ts' } }
  },
  renderer: {
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
    build: { chunkSizeWarningLimit: 2000 }
  }
})

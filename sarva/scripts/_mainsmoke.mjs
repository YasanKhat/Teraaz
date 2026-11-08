// آزمونِ دود: بسته‌ی فرآیندِ اصلی را با یک electronِ شبیه‌سازی‌شده اجرا می‌کند
// تا معلوم شود نقطه‌ی شروع واقعاً پنجره می‌سازد و دستگیره‌ها ثبت می‌شوند.
import Module from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const handlers = new Map()
let made = 0, loaded = null

class BrowserWindow {
  constructor(o) { made++; this.opts = o; this.webContents = { send(){}, setWindowOpenHandler(){} } }
  once() {} show() {} loadFile(f) { loaded = f } loadURL(u) { loaded = u }
  static getAllWindows() { return [] }
}
const electron = {
  app: {
    getPath: () => fs.mkdtempSync(path.join(os.tmpdir(), 'sarva-')),
    whenReady: () => Promise.resolve(),
    quit(){}, on(){},
  },
  BrowserWindow,
  Menu: { buildFromTemplate: (t) => ({ t }), setApplicationMenu(){} },
  ipcMain: { handle: (ch, fn) => handlers.set(ch, fn) },
  dialog: { showOpenDialog: async () => ({ canceled: true }), showSaveDialog: async () => ({ canceled: true }) },
  shell: { openExternal(){}, openPath(){} },
}
const orig = Module._load
Module._load = function (req, parent, isMain) {
  if (req === 'electron') return electron
  return orig.apply(this, arguments)
}
await import('/home/user/Teraaz/sarva/out/main/index.js')
await new Promise((r) => setTimeout(r, 200))

const need = ['sarva:read-file','sarva:write-file','sarva:pick-file','sarva:save-file',
              'sarva:random-beyt','sarva:ganjoor-meter','sarva:render-score']
let bad = 0
for (const ch of need) { if (!handlers.has(ch)) { console.log('❌ دستگیره ثبت نشد:', ch); bad++ } }
console.log(made === 1 ? '✅ یک پنجره ساخته شد' : `❌ شمارِ پنجره‌ها: ${made}`)
console.log(loaded ? `✅ صفحه بار شد: ${path.basename(String(loaded))}` : '❌ loadFile/loadURL صدا زده نشد')

// ساختِ واقعیِ یک پارتیتور از راهِ دستگیره
const render = handlers.get('sarva:render-score')
const t0 = Date.now()
const sc = await render(null, { mode: 'shur', unit: 1, character: 'lyric',
  hemis: [{ longs: [true,false,true], footStart: [true,false,false] }] })
const ms = Date.now() - t0
console.log(sc && sc.left?.length > 1000
  ? `✅ پارتیتور در فرآیندِ اصلی ساخته شد — ${sc.left.length} نمونه، ${sc.sr}Hz، ${sc.duration.toFixed(2)}s، ${ms} میلی‌ثانیه`
  : '❌ پارتیتور ساخته نشد')
process.exit(bad === 0 && made === 1 && loaded && sc?.left?.length > 1000 ? 0 : 1)

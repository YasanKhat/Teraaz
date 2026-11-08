import { app, shell, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/**
 * فرایندِ اصلیِ سروا.
 *
 * هیچ سروری در کار نیست. تنها چیزی که این پوسته به رندرر می‌دهد یک «فضای
 * پرونده» است: خواندن و نوشتنِ پشتیبان و نشانیِ پوشهٔ داده. بقیهٔ منطق —
 * از جمله ذخیرهٔ پیشرفت و نشانک‌ها — در خودِ رندرر و روی همین دستگاه است.
 */

const DEV_URL = process.env['ELECTRON_RENDERER_URL']

const storeDir = () => join(app.getPath('userData'), 'sarva')

async function ensureStore() {
  const dir = storeDir()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  return dir
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: '#0b121d',
    title: 'سروا',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  win.once('ready-to-show', () => win.show())

  // پیوندهای بیرونی (کانال تلگرام، گنجور…) در مرورگرِ خودِ سیستم باز می‌شوند.
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (DEV_URL) win.loadURL(DEV_URL)
  else win.loadFile(join(__dirname, '../renderer/index.html'))

  return win
}

/** منوی فارسی، با همان ترتیبِ نوارِ بالای سایت. */
function buildMenu(win: BrowserWindow): Menu {
  const go = (path: string) => () => win.webContents.send('sarva:navigate', path)

  return Menu.buildFromTemplate([
    {
      label: 'سروا',
      submenu: [
        { label: 'دربارهٔ سروا', role: 'about' },
        { type: 'separator' },
        { label: 'تنظیمات…', accelerator: 'CmdOrCtrl+,', click: go('/panel/setting') },
        { type: 'separator' },
        { label: 'پنهان‌کردن', role: 'hide' },
        { label: 'بستن', role: 'quit' }
      ]
    },
    {
      label: 'بخش‌ها',
      submenu: [
        { label: 'خانه', click: go('/') },
        { label: 'درسنامه', click: go('/doroos') },
        { label: 'وزن‌یاب', accelerator: 'CmdOrCtrl+1', click: go('/vazn-yab') },
        { label: 'عروض سماعی', accelerator: 'CmdOrCtrl+2', click: go('/aruz') },
        { label: 'آزمون صوتی', click: go('/quiz') },
        { label: 'امتحان نهایی', click: go('/exam') },
        { label: 'کنکور', click: go('/konkur') },
        { label: 'بازی‌ها', accelerator: 'CmdOrCtrl+3', click: go('/game') },
        { label: 'آرایه و دستور', click: go('/learn') },
        { label: 'خط‌زمانهٔ ادبیات', click: go('/timeline') },
        { label: 'شبِ امتحان', click: go('/shab-emtehan') },
        { label: 'سروا کلاب', click: go('/sarvaclub') },
        { label: 'پنل من', accelerator: 'CmdOrCtrl+4', click: go('/panel') },
        { type: 'separator' },
        { label: 'مدیریت محتوا', click: go('/admin') }
      ]
    },
    {
      label: 'نمایش',
      submenu: [
        { label: 'بازنشانیِ اندازه', role: 'resetZoom' },
        { label: 'بزرگ‌تر', role: 'zoomIn' },
        { label: 'کوچک‌تر', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'تمام‌صفحه', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'ابزارهای توسعه', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'پرونده',
      submenu: [
        { label: 'دریافت پشتیبان…', click: () => win.webContents.send('sarva:export-backup') },
        { label: 'بازیابی پشتیبان…', click: () => win.webContents.send('sarva:import-backup') },
        { type: 'separator' },
        { label: 'گشودنِ پوشهٔ داده‌ها', click: () => shell.openPath(storeDir()) }
      ]
    }
  ])
}

function registerIpc() {
  ipcMain.handle('sarva:read-file', async (_e, rel: string) => {
    const path = join(await ensureStore(), String(rel).replace(/[^a-zA-Z0-9._\-/]/g, '_'))
    if (!existsSync(path)) return null
    return await readFile(path, 'utf8')
  })

  ipcMain.handle('sarva:write-file', async (_e, rel: string, data: string) => {
    const path = join(await ensureStore(), String(rel).replace(/[^a-zA-Z0-9._\-/]/g, '_'))
    await writeFile(path, data, 'utf8')
    return path
  })

  ipcMain.handle('sarva:pick-file', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'پشتیبان سروا', extensions: ['json'] }]
    })
    if (res.canceled || !res.filePaths[0]) return null
    return await readFile(res.filePaths[0], 'utf8')
  })

  ipcMain.handle('sarva:save-file', async (_e, data: string, name: string) => {
    const res = await dialog.showSaveDialog({
      defaultPath: name || 'sarva-backup.json',
      filters: [{ name: 'پشتیبان سروا', extensions: ['json'] }]
    })
    if (res.canceled || !res.filePath) return null
    await writeFile(res.filePath, data, 'utf8')
    return res.filePath
  })

  ipcMain.handle('sarva:random-beyt', async () => randomBeyt())

  ipcMain.handle('sarva:ganjoor-meter', async (_e, poem1: string, poem2: string) =>
    ganjoorMeter(poem1, poem2)
  )
}

/* ── بیتِ تصادفیِ گنجور ─────────────────────────────────────────────────
 *
 * در سایتِ اصلی مسیرِ `/api/random-beyt` سمتِ سرور اجرا می‌شود و از گنجور
 * یک بیتِ تصادفی با وزنِ ثبت‌شده می‌گیرد. اینجا همان کار در فرآیندِ اصلی
 * انجام می‌شود، چون پنجره‌ی الکترون سروری ندارد که مسیر را سرو کند.
 *
 * همان فهرستِ شاعرانی که خودِ سایت در جدولِ زمان‌خطِ ادبی به کار می‌برد؛
 * از بسته‌ی زنده استخراج شده و چیزی به آن افزوده نشده.
 */
const GANJOOR_POETS = [
  'abdullah','adib','aghakhan','anvari','aref','attar','bahaee','bahar','balami','bidel',
  'daghighi','daye','ebneyamin','eraghi','eshghi','faghani','fani','farrokhi','ferdousi',
  'forooghi','ghaani','ghaemmagham','ghatran','hafez','hanzale','hatef','iraj','jamal','jami',
  'kalim','kamal','keikavus','kesayee','khaghani','khajoo','manoochehri','meybodi','mohtasham',
  'monshi','moshtagh','moulavi','naserkhosro','neshat','nezami','obeyd','onsori','orfi','parvin',
  'roodaki','saadi','saeb','salman','sanaee','seyf','shahid','shahnematollah','shahriar','vahid',
  'vahshi','yazdi'
]

type Beyt = {
  couplet: { first: string; second: string }
  poet?: string
  book?: string
  poem?: string
  url?: string
  meter?: string
}

/** `title » book » poem` را به سه بخش می‌شکند — همان ترتیبِ گنجور. */
function splitFullTitle(fullTitle: string): { poet?: string; book?: string; poem?: string } {
  const parts = String(fullTitle || '')
    .split('»')
    .map((p) => p.trim())
    .filter(Boolean)
  return { poet: parts[0], book: parts[1], poem: parts[2] }
}

async function getJson(url: string, ms = 12_000): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(ms)
  })
  if (!res.ok) throw new Error(`ganjoor ${res.status}`)
  return await res.json()
}

/**
 * یک بیتِ تصادفی از گنجور.
 *
 * دو درخواست لازم است: نخست شاعر را با نامک برمی‌گردانیم تا پاسخِ بیت
 * «شاعر، کتاب، شعر» داشته باشد؛ بعد یک شعرِ تصادفی از همان شاعر.
 * اگر هر مرحله ناموفق بود، به بیتِ تصادفیِ بی‌نامِ کلِ گنجور برمی‌گردیم.
 */
async function randomBeyt(): Promise<Beyt> {
  // یک درخواستِ تنها: `fullTitle` خودش «شاعر » کتاب » شعر» است، پس نیازی به
  // جست‌وجویِ جداگانه‌ی شاعر نیست — پیش از این دو درخواست پشتِ‌سرِ هم می‌رفت
  // و تا نوزده ثانیه طول می‌کشید.
  const poem = await getJson(`https://api.ganjoor.net/api/ganjoor/poem/random?fmt=json`, 11_000)

  const lines = String(poem.plainText || poem.text || '')
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) throw new Error('no-couplet')

  const { poet, book, poem: t } = splitFullTitle(poem.fullTitle)
  return {
    couplet: { first: lines[0], second: lines[1] },
    poet,
    book,
    poem: t || poem.title,
    url: poem.fullUrl || poem.ganjoorUrl,
    meter: poem.rhythm || undefined
  }
}

/* ── جست‌وجویِ وزن در گنجور ────────────────────────────────────────────
 *
 * معادلِ مسیرِ `/api/vazn-yab` در سایتِ اصلی: بیت را در گنجور جست‌وجو می‌کند و
 * اگر آن را یافت، وزنِ ثبت‌شده (`rhythm`) را برمی‌گرداند. سایت فقط وقتی
 * `source === "ganjoor"` باشد پاسخ را می‌پذیرد — اینجا هم همین است و هر شکستی
 * `null` برمی‌گرداند تا موتورِ محلی کارش را بکند — درست مانندِ خودِ سایت.
 */

type GanjoorMeter = {
  rhythm: string
  source: 'ganjoor'
  url?: string
  poet?: string
  book?: string
  poem?: string
}

async function ganjoorMeter(poem1: string, poem2: string): Promise<GanjoorMeter | null> {
  const term = String(poem1 || '').trim()
  if (term.length < 4) return null

  try {
    // ۱) بیت را در گنجور جست‌وجو می‌کنیم تا شناسه‌ی شعر به دست آید
    const res = await getJson(
      `https://api.ganjoor.net/api/ganjoor/search?term=${encodeURIComponent(term)}`,
      9_000
    )
    const hit = res?.poems?.[0] ?? res?.poem?.[0] ?? null
    const id = hit?.id ?? hit?.poemId ?? null
    if (!id) return null

    // ۲) خودِ شعر را می‌گیریم: `rhythm` همان وزنِ ثبت‌شده است
    const poem = await getJson(`https://api.ganjoor.net/api/ganjoor/poem/${id}`, 9_000)
    const rhythm = poem?.rhythm ? String(poem.rhythm).trim() : ''
    if (!rhythm) return null

    const { poet, book, poem: t } = splitFullTitle(poem.fullTitle)
    return {
      rhythm,
      source: 'ganjoor',
      url: poem.fullUrl || poem.ganjoorUrl,
      poet,
      book,
      poem: t || poem.title
    }
  } catch {
    return null
  }
}

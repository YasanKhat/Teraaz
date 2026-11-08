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
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') app.setAppUserModelId('com.sarva.app')
  await ensureStore()
  registerIpc()

  const win = createWindow()
  Menu.setApplicationMenu(buildMenu(win))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      Menu.setApplicationMenu(buildMenu(createWindow()))
    }
  })
})

app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (event, url) => {
    // به‌جز dev server و فایل‌های محلی، هر مقصدی در مرورگر باز شود.
    const local = url.startsWith('file://') || url.startsWith('http://localhost')
    if (!local) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

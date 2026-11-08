import { contextBridge, ipcRenderer } from 'electron'

/**
 * پلِ امنِ `window.sarva`.
 *
 * رندرر هیچ دسترسیِ مستقیمی به Node ندارد. هرچه لازم دارد از همین‌جا می‌آید،
 * و در مرورگر (پیش‌نمایش وب) همان رابط با یک پیاده‌سازیِ مرورگری پر می‌شود —
 * پس کدِ صفحه‌ها هیچ فرقی نمی‌کند.
 */

const api = {
  readFile: (rel: string) => ipcRenderer.invoke('sarva:read-file', rel) as Promise<string | null>,
  writeFile: (rel: string, data: string) =>
    ipcRenderer.invoke('sarva:write-file', rel, data) as Promise<string>,
  pickFile: () => ipcRenderer.invoke('sarva:pick-file') as Promise<string | null>,
  saveFile: (data: string, name: string) =>
    ipcRenderer.invoke('sarva:save-file', data, name) as Promise<string | null>,
  onNavigate: (cb: (path: string) => void) => {
    const handler = (_e: unknown, path: string) => cb(path)
    ipcRenderer.on('sarva:navigate', handler)
    return () => ipcRenderer.removeListener('sarva:navigate', handler)
  },
  onExportBackup: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('sarva:export-backup', handler)
    return () => ipcRenderer.removeListener('sarva:export-backup', handler)
  },
  onImportBackup: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('sarva:import-backup', handler)
    return () => ipcRenderer.removeListener('sarva:import-backup', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('sarva', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore — در صورتِ غیرفعال‌بودنِ ایزولاسیون
  window.sarva = api
}

import { contextBridge } from 'electron'

// A deliberately tiny bridge. Taraz stores its data locally in the renderer,
// so the desktop shell only exposes environment information.
contextBridge.exposeInMainWorld('taraz', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
})

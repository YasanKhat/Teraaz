export interface TarazBridge {
  platform: string
  versions: {
    electron: string
    chrome: string
    node: string
  }
}

declare global {
  interface Window {
    taraz?: TarazBridge
  }
}

export {}

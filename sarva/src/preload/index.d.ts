export interface SarvaBridge {
  readFile(rel: string): Promise<string | null>
  writeFile(rel: string, data: string): Promise<string>
  pickFile(): Promise<string | null>
  saveFile(data: string, name: string): Promise<string | null>
  onNavigate(cb: (path: string) => void): () => void
  onExportBackup(cb: () => void): () => void
  onImportBackup(cb: () => void): () => void
}

declare global {
  interface Window {
    sarva?: SarvaBridge
  }
}

export {}

export interface SarvaBridge {
  readFile(rel: string): Promise<string | null>
  writeFile(rel: string, data: string): Promise<string>
  pickFile(): Promise<string | null>
  saveFile(data: string, name: string): Promise<string | null>
  randomBeyt(): Promise<import('../renderer/src/lib/vazn-yab/ganjoor').Beyt>
  ganjoorMeter(
    poem1: string,
    poem2: string
  ): Promise<import('../renderer/src/lib/vazn-yab/ganjoor').GanjoorMeter | null>
  renderScore(input: unknown): Promise<{
    left: Float32Array
    right: Float32Array
    sr: number
    onsets: number[]
    cadence: number
    duration: number
  } | null>
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

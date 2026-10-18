function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(rows: (string | number)[][]): string {
  const escape = (value: string | number): string => {
    const text = String(value ?? '')
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  return '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  triggerDownload(filename, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
}

export function downloadJson(filename: string, data: unknown): void {
  triggerDownload(
    filename,
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  )
}

export function downloadText(filename: string, content: string, type = 'text/plain'): void {
  triggerDownload(filename, new Blob([content], { type: `${type};charset=utf-8` }))
}

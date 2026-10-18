const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

let persianDigits = true

/** Toggle Persian numerals globally. Called by the app shell from settings. */
export function setPersianDigits(value: boolean): void {
  persianDigits = value
}

export function usePersianDigits(): boolean {
  return persianDigits
}

/** Convert Latin digits in a string/number to Persian digits (when enabled). */
export function fa(value: string | number): string {
  const text = String(value)
  if (!persianDigits) return text
  return text.replace(/[0-9]/g, (digit) => FA_DIGITS[Number(digit)])
}

/** Always convert Latin digits to Persian — useful for branded labels. */
export function faAlways(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => FA_DIGITS[Number(digit)])
}

/** Normalise Persian/Arabic input digits to Latin so Number() can parse them. */
export function latinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
}

export function groupDigits(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0)
  return Math.abs(rounded).toLocaleString('en-US')
}

export function parseAmount(value: string): number {
  const cleaned = latinDigits(value).replace(/[^\d-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

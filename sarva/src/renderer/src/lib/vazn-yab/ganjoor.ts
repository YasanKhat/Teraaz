/**
 * پیوندِ وزن‌یاب با گنجور.
 *
 * سایتِ اصلی دو کانال دارد: `/api/random-beyt` (یک بیتِ تصادفی همراه با وزنِ
 * ثبت‌شده) و `/api/vazn-yab` (جست‌وجوی وزن در گنجور وقتی موتورِ محلی جوابی
 * پیدا نکند). این پورت سرور ندارد، پس هر دو از فرآیندِ اصلیِ الکترون صدا
 * زده می‌شوند و در پیش‌نمایشِ وب همان مسیرها امتحان می‌شوند.
 *
 * ⚠️ شکلِ پاسخ همان است که صفحه‌ی زنده می‌خواند: `couplet.first`،
 *    `couplet.second`، `poet`، `book`، `poem`، `url`، `meter`.
 */

export type Beyt = {
  couplet: { first: string; second: string }
  poet?: string
  book?: string
  poem?: string
  url?: string
  meter?: string
}

/** پاسخِ مسیرِ `/api/vazn-yab` وقتی بیت در گنجور پیدا شود. */
export type GanjoorMeter = {
  rhythm: string
  source: "ganjoor"
  url?: string
  poet?: string
  book?: string
  poem?: string
}

/** همان متنی که صفحه‌ی زنده هنگامِ شکست نشان می‌دهد. */
export const GANJOOR_ERROR = "بیتی از گنجور به دست نیامد.";

function isBeyt(v: unknown): v is Beyt {
  const b = v as Beyt | null;
  return !!b && !!b.couplet && typeof b.couplet.first === "string" && typeof b.couplet.second === "string";
}

/**
 * یک بیتِ تصادفی از گنجور.
 *
 * در الکترون از پلِ `window.sarva` می‌رود (فرآیندِ اصلی نت‌ورک دارد و محدودیتِ
 * CORS ندارد)؛ در پیش‌نمایشِ وب همان مسیرِ `/api/random-beyt` صدا زده می‌شود.
 */
export async function fetchRandomBeyt(): Promise<Beyt> {
  const bridge = (globalThis as { sarva?: { randomBeyt?: () => Promise<unknown> } }).sarva;

  if (bridge?.randomBeyt) {
    const data = await bridge.randomBeyt();
    if (isBeyt(data)) return data;
    throw new Error(GANJOOR_ERROR);
  }

  const res = await fetch("/api/random-beyt", {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !isBeyt(data)) throw new Error((data as { error?: string })?.error || GANJOOR_ERROR);
  return data;
}

/**
 * وزنِ ثبت‌شده‌ی یک بیت در گنجور.
 *
 * ⚠️ درست مانندِ سایت: فقط پاسخی پذیرفته می‌شود که `source === "ganjoor"` باشد.
 *    هر شکستی `null` برمی‌گرداند تا موتورِ محلی وزن را حدس بزند.
 */
export async function fetchGanjoorMeter(poem1: string, poem2: string): Promise<GanjoorMeter | null> {
  const bridge = (globalThis as {
    sarva?: { ganjoorMeter?: (a: string, b: string) => Promise<unknown> }
  }).sarva;

  if (bridge?.ganjoorMeter) {
    try {
      const data = await bridge.ganjoorMeter(poem1, poem2);
      if (data && (data as GanjoorMeter).source === "ganjoor" && (data as GanjoorMeter).rhythm) {
        return data as GanjoorMeter;
      }
      return null;
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch("/api/vazn-yab", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poem1, poem2 }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.ok && data?.data?.source === "ganjoor" ? (data.data as GanjoorMeter) : null;
  } catch {
    return null;
  }
}

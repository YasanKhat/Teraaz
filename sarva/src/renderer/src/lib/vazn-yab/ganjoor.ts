/**
 * پیوندِ وزن‌یاب با گنجور.
 *
 * سایتِ اصلی دو کانال دارد: `/api/random-beyt` (یک بیتِ تصادفی همراه با وزنِ
 * ثبت‌شده) و `/api/vazn-yab` (جست‌وجوی وزن در گنجور وقتی موتورِ محلی جوابی
 * پیدا نکند). این پورت سرور ندارد، پس سه راه دارد و به ترتیب امتحان می‌شوند:
 *
 *   ۱. فرآیندِ اصلیِ الکترون (`window.sarva`) — نت‌ورکِ آزاد و بدونِ CORS؛
 *   ۲. فراخوانیِ مستقیمِ APIِ عمومیِ گنجور از خودِ صفحه؛
 *   ۳. همان مسیرهای `/api/*`، برای وقتی که پشتِ یک سرورِ واقعی باشد.
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

const API = "https://api.ganjoor.net/api/ganjoor";

/** `title » book » poem` را به سه بخش می‌شکند — همان ترتیبِ گنجور. */
function splitFullTitle(fullTitle: string) {
  const parts = String(fullTitle || "")
    .split("»")
    .map((p) => p.trim())
    .filter(Boolean);
  return { poet: parts[0], book: parts[1], poem: parts[2] };
}

function isBeyt(v: unknown): v is Beyt {
  const b = v as Beyt | null;
  return !!b && !!b.couplet && typeof b.couplet.first === "string" && typeof b.couplet.second === "string";
}

async function getJson(url: string, ms: number): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`ganjoor ${res.status}`);
  return await res.json();
}

/* ── بیتِ تصادفی ───────────────────────────────────────────────────── */

/** یک شعرِ تصادفی از گنجور را به «بیت» تبدیل می‌کند. */
function beytFromPoem(poem: any, poetName?: string): Beyt {
  const lines = String(poem.plainText || poem.text || "")
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("no-couplet");
  const { poet, book, poem: t } = splitFullTitle(poem.fullTitle);
  return {
    couplet: { first: lines[0], second: lines[1] },
    poet: poet || poetName,
    book,
    poem: t || poem.title,
    url: poem.fullUrl || poem.ganjoorUrl,
    meter: poem.rhythm || undefined,
  };
}

/**
 * یک بیتِ تصادفی از گنجور.
 *
 * «شاعر، کتاب، شعر» را هم برمی‌گرداند، چون ماژولِ وزن‌یاب آن‌ها را زیرِ فرم نشان
 * می‌دهد (در سایت هم همین است).
 */
/* این ماژول هم در رندرر (با کتابخانه‌ی DOM) و هم در فرآیندِ اصلیِ الکترون
   (با نوع‌های Node) ترجمه می‌شود. `fetch` در هر دو هست، اما نوعِ
   `RequestInit` در Node گزینه‌ی `cache` را ندارد و `json()` در آن `unknown`
   برمی‌گرداند. این دو نوعِ محلی همان شکل را برای هر دو محیط تعریف می‌کنند
   تا رفتار یکی بماند. */
type JsonResponse = { ok: boolean; json(): Promise<unknown> }

function fetchJson(url: string, init: Record<string, unknown>): Promise<JsonResponse> {
  return fetch(url, init as RequestInit) as unknown as Promise<JsonResponse>
}


export async function fetchRandomBeyt(): Promise<Beyt> {
  const bridge = (globalThis as { sarva?: { randomBeyt?: () => Promise<unknown> } }).sarva;

  // ۱) فرآیندِ اصلیِ الکترون
  if (bridge?.randomBeyt) {
    try {
      const data = await bridge.randomBeyt();
      if (isBeyt(data)) return data;
    } catch {
      /* می‌رویم سراغِ راهِ بعدی */
    }
  }

  // ۲) فراخوانیِ مستقیم — یک درخواستِ تنها کافی است: `fullTitle` خودش
  //    «شاعر » کتاب » شعر» است، پس نیازی به جست‌وجویِ جداگانه‌ی شاعر نیست.
  try {
    const poem = await getJson(`${API}/poem/random?fmt=json`, 10_000);
    return beytFromPoem(poem);
  } catch {
    /* راهِ آخر */
  }

  // ۳) مسیرِ سروری (اگر روزی پشتِ یک سرورِ واقعی اجرا شد)
  try {
    const res = await fetchJson("/api/random-beyt", {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !isBeyt(data))
      throw new Error(((data as { error?: string } | null)?.error as string) || GANJOOR_ERROR);
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    throw new Error(msg && !/abort|timeout|fetch|Failed to parse URL/i.test(msg) ? msg : GANJOOR_ERROR)
  }
}

/* ── جست‌وجویِ وزن ─────────────────────────────────────────────────── */

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

  // ۱) فرآیندِ اصلیِ الکترون
  if (bridge?.ganjoorMeter) {
    try {
      const data = await bridge.ganjoorMeter(poem1, poem2);
      if (data && (data as GanjoorMeter).source === "ganjoor" && (data as GanjoorMeter).rhythm) {
        return data as GanjoorMeter;
      }
    } catch {
      /* راهِ بعدی */
    }
  }

  // ۲) فراخوانیِ مستقیم
  try {
    const term = String(poem1 || "").trim();
    if (term.length >= 4) {
      const res = await getJson(`${API}/search?term=${encodeURIComponent(term)}`, 9_000);
      const hit = res?.poems?.[0] ?? res?.poem?.[0] ?? null;
      const id = hit?.id ?? hit?.poemId ?? null;
      if (id) {
        const poem = await getJson(`${API}/poem/${id}`, 9_000);
        const rhythm = poem?.rhythm ? String(poem.rhythm).trim() : "";
        if (rhythm) {
          const { poet, book, poem: t } = splitFullTitle(poem.fullTitle);
          return { rhythm, source: "ganjoor", url: poem.fullUrl || poem.ganjoorUrl, poet, book, poem: t || poem.title };
        }
      }
    }
  } catch {
    /* راهِ آخر */
  }

  // ۳) مسیرِ سروری
  try {
    const res = await fetchJson("/api/vazn-yab", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ poem1, poem2 }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean
      data?: { source?: string } & GanjoorMeter
    } | null;
    return data?.ok && data?.data?.source === "ganjoor" ? (data.data as GanjoorMeter) : null;
  } catch {
    return null;
  }
}

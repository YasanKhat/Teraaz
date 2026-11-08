/**
 * کارگرِ پارتیتور.
 *
 * ⚠️ سایتِ اصلی هم پارتیتور را در یک Worker می‌سازد (`e.r(838090)(Worker)`) و
 *    فقط ماژولِ رندر را درونش بار می‌کند. دلیلش روشن است: ساختنِ یک پارتیتور
 *    حدودِ نیم ثانیه وقتِ پردازنده می‌گیرد، و اگر روی نخِ اصلی باشد انیمیشنِ
 *    ترسیمِ خط‌ها و پرشِ توپ در همان لحظه خشک می‌شود. پیش از این اینجا روی نخِ
 *    اصلی ساخته می‌شد و برای همین هنگامِ پخش لگ می‌آمد.
 */

import { renderScore, type ScoreInput } from "./score";

export type ScoreRequest = { id: number; input: ScoreInput };
export type ScoreResponse = {
  id: number;
  score: { left: Float32Array; right: Float32Array; sr: number; onsets: number[]; cadence: number; duration: number } | null;
};

self.onmessage = (e: MessageEvent<ScoreRequest>) => {
  const { id, input } = e.data;
  try {
    const score = renderScore(input);
    // بافرها را منتقل می‌کنیم، نه رونوشت — حدودِ ۴ مگابایت برای هر پارتیتور.
    (self as unknown as Worker).postMessage({ id, score } satisfies ScoreResponse, [
      score.left.buffer,
      score.right.buffer,
    ]);
  } catch {
    (self as unknown as Worker).postMessage({ id, score: null } satisfies ScoreResponse);
  }
};

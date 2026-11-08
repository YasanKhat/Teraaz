// مرحله‌ی ۵ — بیرون کشیدنِ بسته‌هایی که فقط هنگامِ تعامل بارگیری می‌شوند.
//
// چرا این مرحله لازم است: کدِ اصلیِ سایت را داریم، ولی بخش‌هایی که فقط وقتی
// کاربر دکمه‌ای را می‌زند بار می‌شوند (مثل موتورِ ریتمِ وزن‌یاب) در آن نیست.
// این اسکریپت خودش آن دکمه‌ها را فشار می‌دهد تا آن بسته‌ها بارگیری شوند، بعد
// نشانی‌شان را از فهرستِ منابع می‌خواند و خودشان را هم می‌گیرد.
//
// روی صفحه‌ی /vazn-yab اجرا شود (Sources → Snippets → Ctrl+Enter).
(async () => {
  const of = window.fetch, sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { when: new Date().toISOString(), newChunks: {}, resources: [] };

  const known = new Set(
    performance.getEntriesByType('resource')
      .map(e => e.name)
      .filter(n => n.includes('/_next/static/'))
  );
  console.log('پیش از تعامل:', known.size, 'بسته');

  // ── ۱. هرچه روی صفحه شبیهِ دکمه‌ی پخش است را فشار بده ──────────────
  const clickables = [...document.querySelectorAll('button, [role="button"], [aria-label]')];
  const suspects = clickables.filter(el => {
    const t = (el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '');
    return /پخش|ریتم|صدا|play|صوت/i.test(t);
  });
  console.log('دکمه‌های احتمالی:', suspects.length);

  for (const el of suspects.slice(0, 12)) {
    try { el.click(); } catch (e) {}
    await sleep(500);           // فرصت بده بسته‌ی lazy بار شود
  }
  // چند کلیکِ دیگر روی کارت‌های «وزن‌های مشهور» — ممکن است بسته‌ی خودش را بیاورد
  const cards = [...document.querySelectorAll('button[aria-pressed]')];
  for (const el of cards.slice(0, 6)) {
    try { el.click(); } catch (e) {}
    await sleep(450);
  }

  await sleep(1500);

  // ── ۲. بسته‌های تازه را پیدا کن ────────────────────────────────────
  const all = performance.getEntriesByType('resource')
    .map(e => e.name)
    .filter(n => n.includes('/_next/static/'));
  const fresh = [...new Set(all)].filter(n => !known.has(n));
  out.resources = fresh;
  console.log('بسته‌های تازه:', fresh.length);
  fresh.forEach(n => console.log('  ', n));

  // ── ۳. خودشان را هم بگیر ───────────────────────────────────────────
  let bytes = 0;
  for (const url of fresh) {
    try {
      const r = await of(url);
      if (r.ok) {
        const t = await r.text();
        out.newChunks[url] = t;
        bytes += t.length;
      }
    } catch (e) {}
    await sleep(80);
  }
  console.log('دریافت شد:', Object.keys(out.newChunks).length, '—', (bytes / 1000).toFixed(0), 'کیلوبایت');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'sarva-round5.json'; a.click();
  console.log('\n✅ sarva-round5.json ذخیره شد.');
})();

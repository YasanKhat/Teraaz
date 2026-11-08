// مرحله‌ی ۶ — فایل‌های CSSِ سایت (کلاس‌های دقیقِ رابط کاربری)
// در Sources → Snippets بگذار و Ctrl+Enter بزن. هر صفحه‌ای باشد فرقی نمی‌کند.
(async () => {
  const of = window.fetch, sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { when: new Date().toISOString(), css: {} };

  const CSS = [
    "/_next/static/chunks/02gw-uyou56ox.css",
    "/_next/static/chunks/40open5g1pcji.css",
    "/_next/static/chunks/2aze_i82qlve9.css",
    "/_next/static/chunks/2n6wy65rulgmx.css",
    "/_next/static/chunks/0dt_jj-ame4p_.css",
    "/_next/static/chunks/2kdsz6zi5epkq.css",
    "/_next/static/chunks/3v4zn-nu9c044.css",
    "/_next/static/chunks/2a10u-vpis-e1.css",
    "/_next/static/chunks/0x1zvf1ka745t.css",
    "/_next/static/chunks/1fy1oklef76_2.css",
    "/_next/static/chunks/323mndcyi1jpj.css",
    "/_next/static/chunks/26u8eky0jpi7_.css",
    "/_next/static/chunks/1degnikedv04j.css",
    "/_next/static/chunks/1rzoh7i6kbr9t.css",
    "/_next/static/chunks/00sh0asgivvnn.css",
    "/_next/static/chunks/28ki4og3uujx3.css",
    "/_next/static/chunks/3rvomi99jkc7a.css",
    "/_next/static/chunks/0b-0z-cy-cq-l.css",
    "/_next/static/chunks/232rbzp037-61.css",
    "/_next/static/chunks/1uhf5ovoi9ufz.css",
    "/_next/static/chunks/15o8bbp6_8_ca.css",
    "/_next/static/chunks/434ox1ucjovcy.css",
    "/_next/static/chunks/0abjmwozhwvpr.css",
    "/_next/static/chunks/3_2ua89q5dg-x.css",
    "/_next/static/chunks/2s1uvlp60xdhw.css",
    "/_next/static/chunks/21hpwhol9ju-1.css",
    "/_next/static/chunks/442sn_6zi1_09.css"
  ];

  let bytes = 0;
  for (const url of CSS) {
    try {
      const r = await of(url);
      if (r.ok) { const t = await r.text(); out.css[url] = t; bytes += t.length; }
    } catch (e) {}
    await sleep(60);
  }
  console.log('دریافت شد:', Object.keys(out.css).length, '/', CSS.length, '—', (bytes / 1000).toFixed(0), 'کیلوبایت');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'sarva-round6.json'; a.click();
  console.log('\n✅ sarva-round6.json ذخیره شد.');
})();

// مرحله‌ی ۴ — برگه‌های کنکور، داده‌ی بازی‌های تازه، متنِ درس‌ها
// در Sources → Snippets بگذار و Ctrl+Enter بزن.
(async () => {
  const of = window.fetch, sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { when: new Date().toISOString(), konkur: {}, games: {}, lessons: {}, api: {} };

  const KONKUR = [
    ["1404-tir-321a", "کنکور تیر ۱۴۰۴"],
    ["ensani-1403-tir-321a-oloom-fonoon", "کنکور تیر ۱۴۰۳"],
    ["ensani-1402-tir-321a-oloom-fonoon", "کنکور تیر ۱۴۰۲"],
    ["ensani-1401-tir-321a-oloom-fonoon", "کنکور تیر ۱۴۰۱"],
    ["ensani-1400-tir-321a-oloom-fonoon", "کنکور تیر ۱۴۰۰"],
    ["ensani-1399-mordad-321a-oloom-fonoon", "کنکور مرداد ۱۳۹۹"],
    ["ensani-1398-tir-oloom-fonoon", "کنکور تیر ۱۳۹۸"]
  ];

  const LESSONS = [
    "/doroos/dahom/1",
    "/doroos/dahom/10",
    "/doroos/dahom/11",
    "/doroos/dahom/12",
    "/doroos/dahom/13",
    "/doroos/dahom/14",
    "/doroos/dahom/16",
    "/doroos/dahom/17",
    "/doroos/dahom/18",
    "/doroos/dahom/2",
    "/doroos/dahom/3",
    "/doroos/dahom/5",
    "/doroos/dahom/6",
    "/doroos/dahom/7",
    "/doroos/dahom/8",
    "/doroos/dahom/9",
    "/doroos/dahom/ganj-1",
    "/doroos/dahom/ganj-10",
    "/doroos/dahom/ganj-12",
    "/doroos/dahom/ganj-14",
    "/doroos/dahom/ganj-17",
    "/doroos/dahom/ganj-3",
    "/doroos/dahom/ganj-6",
    "/doroos/dahom/ganj-8",
    "/doroos/dahom/niyayesh",
    "/doroos/dahom/ravan-11",
    "/doroos/dahom/ravan-16",
    "/doroos/dahom/ravan-18",
    "/doroos/dahom/ravan-2",
    "/doroos/dahom/ravan-9",
    "/doroos/dahom/setayesh",
    "/doroos/dahom/sher-13",
    "/doroos/dahom/sher-5",
    "/doroos/dahom/sher-7",
    "/doroos/davazdahom/1",
    "/doroos/davazdahom/10",
    "/doroos/davazdahom/11",
    "/doroos/davazdahom/12",
    "/doroos/davazdahom/13",
    "/doroos/davazdahom/14",
    "/doroos/davazdahom/16",
    "/doroos/davazdahom/17",
    "/doroos/davazdahom/18",
    "/doroos/davazdahom/2",
    "/doroos/davazdahom/3",
    "/doroos/davazdahom/5",
    "/doroos/davazdahom/6",
    "/doroos/davazdahom/7",
    "/doroos/davazdahom/8",
    "/doroos/davazdahom/9",
    "/doroos/yazdahom/1",
    "/doroos/yazdahom/10",
    "/doroos/yazdahom/11",
    "/doroos/yazdahom/12",
    "/doroos/yazdahom/14",
    "/doroos/yazdahom/15",
    "/doroos/yazdahom/16",
    "/doroos/yazdahom/17",
    "/doroos/yazdahom/18",
    "/doroos/yazdahom/2",
    "/doroos/yazdahom/3",
    "/doroos/yazdahom/5",
    "/doroos/yazdahom/6",
    "/doroos/yazdahom/7",
    "/doroos/yazdahom/8",
    "/doroos/yazdahom/9",
    "/doroos/yazdahom/ganj-1",
    "/doroos/yazdahom/ganj-10",
    "/doroos/yazdahom/ganj-12",
    "/doroos/yazdahom/ganj-15",
    "/doroos/yazdahom/ganj-17",
    "/doroos/yazdahom/ganj-3",
    "/doroos/yazdahom/ganj-6",
    "/doroos/yazdahom/ganj-8",
    "/doroos/yazdahom/niyayesh",
    "/doroos/yazdahom/ravan-16",
    "/doroos/yazdahom/ravan-18",
    "/doroos/yazdahom/ravan-5",
    "/doroos/yazdahom/ravan-9",
    "/doroos/yazdahom/setayesh",
    "/doroos/yazdahom/sher-11",
    "/doroos/yazdahom/sher-14",
    "/doroos/yazdahom/sher-2",
    "/doroos/yazdahom/sher-7"
  ];

  // ── ۱. برگه‌ی هر کنکور ─────────────────────────────────────────────
  for (const [slug] of KONKUR) {
    for (const mode of [{ RSC: '1' }, {}]) {
      try {
        const r = await of('/konkur/' + slug, { credentials: 'include', headers: mode });
        if (r.ok) {
          const t = await r.text();
          if (t && t.length > (out.konkur[slug]?.length || 0)) out.konkur[slug] = t.slice(0, 5e6);
        }
      } catch (e) {}
      await sleep(140);
    }
  }
  console.log('کنکور:', Object.keys(out.konkur).length);

  // ── ۲. داده‌ی دو بازیِ تازه + بقیه‌ی بازی‌ها ───────────────────────
  for (const g of ['imla', 'tarazoo', 'ninja', 'pairs', 'vocab', 'kimia', 'rang-ara']) {
    try { const r = await of('/game/' + g, { credentials: 'include', headers: { RSC: '1' } });
      if (r.ok) out.games[g] = (await r.text()).slice(0, 4e6); } catch (e) {}
    await sleep(200);
  }
  console.log('بازی‌ها:', Object.keys(out.games).length);

  // ── ۳. متنِ هر درس ─────────────────────────────────────────────────
  let n = 0;
  for (const l of LESSONS) {
    const slug = l.replace('/doroos/', '');
    try {
      const r = await of('/api/v1/doroos/text/' + slug, { credentials: 'include' });
      if (r.ok) out.lessons[slug] = (await r.text()).slice(0, 1.5e6);
    } catch (e) {}
    n++;
    if (n % 20 === 0) { console.log('درس:', n, '/', LESSONS.length); await sleep(300); }
    else await sleep(90);
  }
  console.log('درس‌ها:', Object.keys(out.lessons).length);

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'sarva-round4.json'; a.click();
  console.log('\n✅ sarva-round4.json ذخیره شد.');
})();

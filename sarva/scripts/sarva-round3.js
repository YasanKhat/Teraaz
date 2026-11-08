// مرحله‌ی ۳ — برگه‌های کاملِ امتحان + کنکور + بازی‌های تازه
// در Sources → Snippets بگذار و Ctrl+Enter بزن.
(async () => {
  const of = window.fetch, sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { when: new Date().toISOString(), papers: {}, konkur: {}, api: {}, rsc: {} };

  const EXAMS = [
    ["farsi2-1404-khordad", "فارسی۲ یازدهم — امتحان نهایی خرداد ۱۴۰۴"],
    ["farsi2-1404-ordibehesht-asr", "فارسی۲ یازدهم — آزمون شبه‌نهایی عصر اردیبهشت ۱۴۰۴"],
    ["farsi2-1403-khordad", "فارسی۲ یازدهم — امتحان نهایی خرداد ۱۴۰۳"],
    ["farsi2-1403-shabhe-nahayi-asr", "فارسی۲ یازدهم — آزمون شبه‌نهایی عصر ۱۴۰۳"],
    ["farsi2-1403-shabhe-nahayi-sobh", "فارسی۲ یازدهم — امتحان شبه‌نهایی صبح ۱۴۰۳"],
    ["olum-fonoon-1404-shahrivar", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی تابستان (شهریور) ۱۴۰۴"],
    ["olum-fonoon-1404-khordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۴"],
    ["olum-fonoon-1403-shahrivar", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی تابستان (شهریور) ۱۴۰۳"],
    ["olum-fonoon-1403-khordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۳"],
    ["olum-fonoon-1402-shahrivar", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی شهریور ۱۴۰۲"],
    ["olum-fonoon-1402-khordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۲"],
    ["olum-fonoon-1401-shahrivar", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی شهریور ۱۴۰۱"],
    ["olum-fonoon-1401-khordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۱"],
    ["olum-fonoon-1400-khordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۰"],
    ["farsi-1404-shahrivar", "فارسی۳ دوازدهم — امتحان نهایی شهریور ۱۴۰۴"],
    ["farsi-1404-khordad", "فارسی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۴"],
    ["farsi-1403-mordad", "فارسی۳ دوازدهم — امتحان نهایی مرداد ۱۴۰۳ (نوبت تابستان)"],
    ["farsi-1402-shahrivar", "فارسی۳ دوازدهم — امتحان نهایی شهریور ۱۴۰۲"],
    ["farsi-1400-khordad", "فارسی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۰ (ریاضی-فیزیک و علوم تجربی)"],
    ["olum-fonoon-1405-mordad", "علوم و فنون ادبی۳ دوازدهم — امتحان نهایی مرداد ۱۴۰۵"],
    ["1401-dey", "فارسی۳ دوازدهم — امتحان نهایی دی‌ماه ۱۴۰۱"],
    ["1403-kherdad", "فارسی۳ دوازدهم — امتحان نهایی خرداد ۱۴۰۳"],
    ["1402-shahrivar", "آزمون نهایی فارسی ۳ - شهریور ۱۴۰۲"],
    ["1402-dey", "آزمون نهایی فارسی ۳ - دی ۱۴۰۲"],
    ["1403-dey", "آزمون نهایی فارسی ۳ - دی ۱۴۰۳"],
    ["1404-dey", "آزمون نهایی فارسی ۳ - دی ۱۴۰۴"],
    ["1405-tir-mordad", "آزمون نهایی فارسی ۳ - تیر و مرداد ۱۴۰۵"],
    ["1402-kherdad", "آزمون نهایی فارسی ۳ - خرداد ۱۴۰۲"],
    ["1401-kherdad", "آزمون نهایی فارسی ۳ - خرداد ۱۴۰۱"],
    ["1404-kherdad", "آزمون نهایی فارسی ۳ - خرداد ۱۴۰۴"]
  ];

  // ── ۱. برگه‌ی کاملِ هر امتحان ──────────────────────────────────────
  // ⚠️ با هدرِ RSC داده‌ی سرور را می‌گیریم، نه HTML را: برگه در همان
  //    payloadِ سرور است و HTML فقط پوسته است.
  let ok = 0;
  for (const [key] of EXAMS) {
    for (const mode of [{ RSC: '1' }, {}]) {
      try {
        const r = await of('/exam/' + key, { credentials: 'include', headers: mode });
        if (r.ok) {
          const t = await r.text();
          if (t && t.length > (out.papers[key]?.length || 0)) out.papers[key] = t.slice(0, 4e6);
        }
      } catch (e) {}
      await sleep(120);
    }
    ok++;
    if (ok % 5 === 0) console.log('امتحان:', ok, '/', EXAMS.length);
  }
  console.log('برگه‌ها:', Object.keys(out.papers).length);

  // ── ۲. کنکور ───────────────────────────────────────────────────────
  for (const p of ['/konkur', '/konkur/1404', '/konkur/1403', '/konkur/1402']) {
    try { const r = await of(p, { credentials: 'include', headers: { RSC: '1' } });
      if (r.ok) out.konkur[p] = (await r.text()).slice(0, 4e6); } catch (e) {}
    await sleep(250);
  }
  console.log('کنکور:', Object.keys(out.konkur).length);

  // ── ۳. APIهای تازه‌ای که در مرحله‌ی ۲ پیدا شد ──────────────────────
  const eps = ['/api/v1/facts', '/api/v1/notifications', '/api/v1/doroos/quiz',
               '/api/v1/kimia/rounds', '/api/v1/plus/usage', '/api/v1/bookmarks',
               '/api/v1/grammar-circuit/availability', '/api/v1/quiz/answered'];
  for (const e of eps) {
    try { const r = await of(e, { credentials: 'include' });
      if (r.ok) out.api[e] = (await r.text()).slice(0, 3e6); } catch (err) {}
    await sleep(200);
  }
  console.log('API:', Object.keys(out.api).length);

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'sarva-round3.json'; a.click();
  console.log('\n✅ sarva-round3.json ذخیره شد.');
})();

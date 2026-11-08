// مرحله‌ی ۲ — فقط این را در Console/Snippet بزن
(async () => {
  const of = window.fetch, sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { when: new Date().toISOString(), chunks: {}, endpoints: [], api: {}, rsc: {}, extra: {} };
  const CHUNKS = [
    "/_next/static/chunks/0-3t0t4w48nge.js",
    "/_next/static/chunks/0-jr1i-yg3q56.js",
    "/_next/static/chunks/004-th1s9cm85.js",
    "/_next/static/chunks/00cyc7ujgcyq0.js",
    "/_next/static/chunks/02cz405syfpzm.js",
    "/_next/static/chunks/02gdzet63ppjn.js",
    "/_next/static/chunks/03l8w1nxr6kg2.js",
    "/_next/static/chunks/045_4y3w_8cma.js",
    "/_next/static/chunks/05lpicvavu5p7.js",
    "/_next/static/chunks/05n8xiw9ldcpf.js",
    "/_next/static/chunks/07k-5-rrt_akq.js",
    "/_next/static/chunks/0auzaymclgsba.js",
    "/_next/static/chunks/0c4szfty40l1g.js",
    "/_next/static/chunks/0cs2vt5k_z1if.js",
    "/_next/static/chunks/0cz1d0mv5g_q7.js",
    "/_next/static/chunks/0dqp71ysta39s.js",
    "/_next/static/chunks/0epmuivl2yw-3.js",
    "/_next/static/chunks/0id6aevbwms6i.js",
    "/_next/static/chunks/0kk-vay0cbe_5.js",
    "/_next/static/chunks/0kkqah7aqsqcy.js",
    "/_next/static/chunks/0nv7fv895a3bh.js",
    "/_next/static/chunks/0ovh-_2najvf0.js",
    "/_next/static/chunks/0qbxiewcigoc0.js",
    "/_next/static/chunks/0s0cldsibxb0_.js",
    "/_next/static/chunks/0sgpszy_q-l05.js",
    "/_next/static/chunks/0tvjkikjnh8u4.js",
    "/_next/static/chunks/0xb8f_510gnsx.js",
    "/_next/static/chunks/16m_11g-4qbkx.js",
    "/_next/static/chunks/16wgu2ferir-x.js",
    "/_next/static/chunks/16x2wk7nlxaa6.js",
    "/_next/static/chunks/1_6w-u0rwtfjp.js",
    "/_next/static/chunks/1bku7d_fak9rd.js",
    "/_next/static/chunks/1bxhvs7st855a.js",
    "/_next/static/chunks/1en1j_heo313x.js",
    "/_next/static/chunks/1h30d2i80vm-q.js",
    "/_next/static/chunks/1hjjdkhumj-8o.js",
    "/_next/static/chunks/1hnthc45p2336.js",
    "/_next/static/chunks/1j_twpf34dk4e.js",
    "/_next/static/chunks/1l-i7l-6v12o0.js",
    "/_next/static/chunks/1ljagzzaqt35j.js",
    "/_next/static/chunks/1nbsbwf4eo0sk.js",
    "/_next/static/chunks/1nfvuxil5dtl7.js",
    "/_next/static/chunks/1oe85xfvnkpdl.js",
    "/_next/static/chunks/1ov-myy1qk11o.js",
    "/_next/static/chunks/1pe9ih_dw012i.js",
    "/_next/static/chunks/1ql2xz7vxqa0s.js",
    "/_next/static/chunks/1su7ygjp1yrin.js",
    "/_next/static/chunks/1tlfcekszg63c.js",
    "/_next/static/chunks/1v-3o5hb16l75.js",
    "/_next/static/chunks/1xghtx72fa6qr.js",
    "/_next/static/chunks/2-6plfoq6tvtm.js",
    "/_next/static/chunks/2-urkx3cuhmdn.js",
    "/_next/static/chunks/20tzojld0-r7l.js",
    "/_next/static/chunks/23couv201w69z.js",
    "/_next/static/chunks/257w-nk9bqs3h.js",
    "/_next/static/chunks/26g4tn5b226u5.js",
    "/_next/static/chunks/2e37l4ok4os93.js",
    "/_next/static/chunks/2iht22otbgew6.js",
    "/_next/static/chunks/2kk6j4w-m160l.js",
    "/_next/static/chunks/2m5a65cn7-g0k.js",
    "/_next/static/chunks/2mvj4mrm_ttuc.js",
    "/_next/static/chunks/2oeu1-7fcvgfj.js",
    "/_next/static/chunks/2rprsla3y2zlb.js",
    "/_next/static/chunks/2t2eupxgbfuor.js",
    "/_next/static/chunks/2umyj_domujrm.js",
    "/_next/static/chunks/2wfg3e_lyvf8b.js",
    "/_next/static/chunks/2xqj7vysm7zib.js",
    "/_next/static/chunks/2y7lj8i9pdzta.js",
    "/_next/static/chunks/3-gsmd6lx9efb.js",
    "/_next/static/chunks/3092bna6-pccj.js",
    "/_next/static/chunks/315o2rm_6xzt7.js",
    "/_next/static/chunks/34b-o1rh3pkrr.js",
    "/_next/static/chunks/34l-lgsh6eehm.js",
    "/_next/static/chunks/34vqzqe0xs7l5.js",
    "/_next/static/chunks/3c-3so7k9dpa_.js",
    "/_next/static/chunks/3cdyywvycvvh3.js",
    "/_next/static/chunks/3dt1pigoy_aam.js",
    "/_next/static/chunks/3epc9sjgoj-q0.js",
    "/_next/static/chunks/3gqn51srnqach.js",
    "/_next/static/chunks/3hylik04te1o5.js",
    "/_next/static/chunks/3jwtrze96xbu3.js",
    "/_next/static/chunks/3l0lhlnfqn09j.js",
    "/_next/static/chunks/3ltv4w1vw5udc.js",
    "/_next/static/chunks/3lwzkidg8q_zk.js",
    "/_next/static/chunks/3nl42lse5gv59.js",
    "/_next/static/chunks/3sgl_4adf2z1w.js",
    "/_next/static/chunks/3tzbp_rqt1mh6.js",
    "/_next/static/chunks/3vzp021m09nry.js",
    "/_next/static/chunks/3wjq9pz-awxmk.js",
    "/_next/static/chunks/3x2wq53c28xr_.js",
    "/_next/static/chunks/3x434osr4m871.js",
    "/_next/static/chunks/40ox2arb27zlr.js",
    "/_next/static/chunks/40ve_g_g46chj.js",
    "/_next/static/chunks/44miw3khhq38-.js",
    "/_next/static/chunks/44v6qnjlp6wj7.js",
    "/_next/static/chunks/44vkfojj1r-1n.js",
    "/_next/static/chunks/turbopack-3xuvfipjjzqov.js"
  ];

  // ── ۱. همه‌ی بسته‌های کدِ امروز ────────────────────────────────────
  let got = 0, bytes = 0;
  for (const c of CHUNKS) {
    try { const r = await of(c); if (r.ok) { const t = await r.text(); out.chunks[c] = t; got++; bytes += t.length; } }
    catch (e) {}
    await sleep(60);
  }
  console.log('بسته‌ها:', got, '/', CHUNKS.length, '—', (bytes/1e6).toFixed(1), 'مگابایت');

  const code = Object.values(out.chunks).join('\n');

  // ── ۲. همهٔ نشانی‌های API از دلِ کد ─────────────────────────────────
  const eps = new Set();
  for (const m of code.matchAll(/["'`](\/api\/[A-Za-z0-9\-_\/\.\$\{\}]{2,90})["'`]/g)) eps.add(m[1]);
  out.endpoints = [...eps];
  console.log('نقاطِ API:', out.endpoints.length, '\n' + out.endpoints.join('\n'));

  // ── ۳. هر API را صدا بزن ───────────────────────────────────────────
  for (const e of out.endpoints) {
    if (/\[|\{|\$/.test(e)) continue;
    try { const r = await of(e, { credentials: 'include' });
      if (r.ok) { const t = await r.text(); if (t && t.length < 8e6) out.api[e] = t; } } catch {}
    await sleep(150);
  }
  console.log('پاسخ‌های API:', Object.keys(out.api).length);

  // ── ۴. داده‌ی RSCِ صفحه‌های محتوامحور ──────────────────────────────
  const targets = ['/exam', '/exam/farsi', '/exam/1404', '/konkur', '/game/imla', '/game/tarazoo',
                   '/panel/exam', '/panel/analysis', '/panel/subscription', '/panel/setting', '/panel/teacher',
                   '/panel/classes', '/panel/grammar', '/shab-emtehan/morur', '/learn', '/sarvaclub'];
  for (const t of targets) {
    try { const r = await of(t, { credentials: 'include', headers: { RSC: '1' } });
      if (r.ok) out.rsc[t] = (await r.text()).slice(0, 2e6); } catch {}
    await sleep(220);
  }
  console.log('داده‌های RSC:', Object.keys(out.rsc).length);

  // ── ۵. هرچه در کد شبیهِ شناسه/کلید است ─────────────────────────────
  out.extra.examKeys  = [...new Set([...code.matchAll(/["'`](exam[-_][a-z0-9\-_]{2,50})["'`]/gi)].map(m=>m[1]))].slice(0,400);
  out.extra.gameSlugs = [...new Set([...code.matchAll(/"(jasoos|ninja|pairs|vocab|aruz-rapid|aruz-bridge|grammar-circuit|role-hunt|kimia|rang-ara|imla|tarazoo|poets-shelf)"/g)].map(m=>m[1]))];

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'sarva-round2.json'; a.click();
  console.log('\n✅ sarva-round2.json ذخیره شد.');
})();

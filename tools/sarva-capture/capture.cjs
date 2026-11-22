// Anonymous, bounded capture; no login, cookies or account data are exported.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const out = 'sarva-capture-output';
const origin = 'https://sarvaedu.ir';
const routes = ['/', '/game', '/game/jasoos', '/game/vocab', '/game/grammar-circuit',
  '/game/rang-ara', '/game/imla', '/game/aruz-rapid', '/game/taar', '/game/kimia',
  '/game/ninja', '/game/pairs', '/game/aruz-bridge', '/game/role-hunt', '/game/tarazoo',
  '/doroos', '/exam', '/konkur', '/shab-emtehan', '/learn', '/aruz', '/vazn-yab',
  '/timeline', '/sarvaclub', '/guide', '/about', '/plus'];
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
async function main() {
  await fs.mkdir(path.join(out, 'resources'), { recursive: true });
  const report = { started: new Date().toISOString(), routes: [], resources: {}, errors: [] };
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fa-IR', serviceWorkers: 'block' });
      const page = await context.newPage();
      const item = { route, responses: [], errors: [] };
      report.routes.push(item);
      const pending = new Set();
      page.on('pageerror', err => item.errors.push(String(err)));
      page.on('response', response => {
        const task = (async () => {
          const url = response.url();
          let u; try { u = new URL(url); } catch { return; }
          // Never record API responses, URL query parameters, headers, or other origins.
          if (u.origin !== origin || u.pathname.startsWith('/api/') || u.search) return;
          const type = response.headers()['content-type'] || '';
          if (!/javascript|text\/css|font|image|audio/i.test(type)) return;
          try {
            const body = await response.body();
            if (body.length > 10 * 1024 * 1024) return;
            const hash = digest(body);
            await fs.writeFile(path.join(out, 'resources', hash), body);
            report.resources[hash] = { url: u.origin + u.pathname, type, size: body.length, status: response.status() };
            item.responses.push(hash);
          } catch (err) { item.errors.push('resource: ' + String(err)); }
        })();
        pending.add(task); task.finally(() => pending.delete(task));
      });
      try {
        const res = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
        item.status = res?.status();
        await page.waitForTimeout(3000);
        const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
        await fs.writeFile(path.join(out, name + '.html'), await page.content());
        await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true, timeout: 30000 });
        item.title = await page.title();
        // Only explicitly selected, anonymous, non-submitting interactions.
        const action = route === '/' ? 'فهرست' : route === '/game/pairs' ? 'فارسی دهم' : route === '/game/ninja' ? 'بزن بریم' : null;
        if (action) {
          try {
            const button = page.getByRole('button', { name: action, exact: true }).first();
            await button.click({ timeout: 5000 });
            await page.waitForTimeout(1200);
            await fs.writeFile(path.join(out, name + '-interaction.html'), await page.content());
            await page.screenshot({ path: path.join(out, name + '-interaction.png'), fullPage: true, timeout: 30000 });
            const metrics = await page.locator('button, a, [role="menu"], main, h1, h2').evaluateAll(nodes => nodes.slice(0, 250).map(el => {
              const r = el.getBoundingClientRect(), c = getComputedStyle(el);
              return { tag: el.tagName, text: (el.innerText || '').trim().slice(0,200), aria: el.getAttribute('aria-label'), rect: { x:r.x, y:r.y, width:r.width, height:r.height }, style: { display:c.display, fontSize:c.fontSize, color:c.color, backgroundColor:c.backgroundColor, borderRadius:c.borderRadius } };
            }));
            await fs.writeFile(path.join(out, name + '-metrics.json'), JSON.stringify(metrics));
            item.action = action;
          } catch (err) { item.errors.push('interaction: ' + String(err)); }
        }
      } catch (err) { item.errors.push(String(err)); }
      await Promise.allSettled([...pending]);
      await context.close();
    }
  } catch (err) { report.errors.push(String(err)); }
  finally {
    if (browser) await browser.close();
    report.finished = new Date().toISOString();
    await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(report, null, 2));
  }
  if (report.errors.length || report.routes.every(r => !r.status || r.status >= 400)) process.exitCode = 1;
}
main().catch(err => { console.error(err); process.exitCode = 1; });

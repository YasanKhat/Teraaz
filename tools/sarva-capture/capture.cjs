// Anonymous, bounded capture; no login, cookies or account data are exported.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const out = 'sarva-capture-output';
const origin = 'https://sarvaedu.ir';
const routes = ['/', '/game', '/game/ninja', '/game/pairs', '/game/grammar-circuit', '/game/jasoos', '/game/vocab'];
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

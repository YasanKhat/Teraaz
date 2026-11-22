// Public, anonymous local preview regression checks. No account or data changes.
// Run against an already running preview: PLAYWRIGHT_MODULE=... CHROMIUM_PATH=... node ...
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {}) });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'fa-IR' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(process.env.LOCAL_URL || 'http://127.0.0.1:5175/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000); // the initial logo animation is about 3 seconds
      const notice = page.getByRole('region', { name: 'اعلان سایت: خبر خوب' });
      assert.equal(await notice.locator('strong').innerText(), 'سروا کلاب راه اندازی شد🔥');
      assert.equal(await notice.getByRole('link', { name: 'سروا کلاب' }).count(), 1);
      const menuButton = page.getByRole('button', { name: 'فهرست', exact: true });
      await menuButton.focus();
      await page.keyboard.press("Enter");
      const menu = page.locator('[role=menu][aria-label="بخش‌های سروا"]');
      await menu.waitFor({ state: 'visible' });
      await page.waitForTimeout(400); // allow the menu entry animation to finish
      assert.equal(await menu.locator('[role=group]').count(), 3);
      assert.equal(await menu.locator('a').count(), 13);
      assert.equal(await menu.locator('a').filter({ hasText: 'پشتیبانی' }).count(), 1);
      assert.equal(await menu.locator('a').filter({ hasText: 'سروا پلاس' }).count(), 1);
      if (width === 1440) assert.equal(Math.round((await menu.boundingBox()).width), 666);
      await page.keyboard.press('Escape');
      await notice.getByRole('button', { name: 'بستن اعلان' }).click();
      await page.waitForTimeout(400);
      assert.equal(await notice.count(), 0);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      assert.equal(await notice.count(), 0, 'dismissal should persist after reload');
      assert.deepEqual(errors, []);
      console.log(`PASS width=${width}: menu, public announcement, dismissal and reload`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

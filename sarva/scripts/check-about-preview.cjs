// Test public About interactions in a running web preview, with Playwright.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH, args:['--no-sandbox'] } : {}) });
  try {
    for (const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900},locale:'fa-IR'});
      const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto((process.env.LOCAL_URL || 'http://127.0.0.1:5175/')+'#/about', {waitUntil:'domcontentloaded'});
      await page.waitForTimeout(4000);
      await page.locator('main.about-module__UxSSNW__page').waitFor();
      assert.match(await page.locator('h1').innerText(), /ادبیات فارسی/);
      assert.equal(await page.locator('main.about-module__UxSSNW__page details').count(),5);
      assert.equal(await page.locator('main.about-module__UxSSNW__page [role=tab]').count(),5);
      await page.locator('.about-module__UxSSNW__facts').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
      assert.deepEqual(await page.locator('.about-module__UxSSNW__factNum > span').allTextContents(), ['۴۸','۱۳','۱۵۵','۱۵۰']);
      await page.locator('[role=tab]').last().click();
      await page.waitForTimeout(1600);
      assert.equal(await page.locator('.about-module__UxSSNW__dissect').getAttribute('data-step'),'4');
      assert.equal(await page.locator('[role=tab]').last().getAttribute('aria-selected'),'true');
      await page.locator('details summary').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('details').first().evaluate(e=>e.open), true);
      assert.equal(await page.locator('a[href="#/doroos/davazdahom/6"]').count(), 2);
      assert.deepEqual(errors,[]);
      console.log(`PASS width=${width}: about text, tabs, FAQ and lesson links`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});

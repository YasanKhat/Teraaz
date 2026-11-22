// Measure only the anonymous, public announcement; do not use account state.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'fa-IR' });
    const page = await context.newPage();
    await page.goto('https://sarvaedu.ir/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    const result = await page.locator('[aria-label^="اعلان سایت"]').evaluate(e => {
      const r=e.getBoundingClientRect(), c=getComputedStyle(e), a=e.querySelector('a'), ar=a.getBoundingClientRect();
      return { title:e.querySelector('strong')?.innerText, text:e.querySelector('p')?.innerText, rect:{x:r.x,y:r.y,width:r.width,height:r.height}, radius:c.borderRadius, bg:c.backgroundColor, link:{text:a.innerText,width:ar.width,height:ar.height}, close:e.querySelector('button')?.getAttribute('aria-label') };
    });
    console.log(`::notice title=Announcement${width}::${JSON.stringify(result)}`);
    await context.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exitCode=1; });

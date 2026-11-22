// Anonymous site measurement used to compare the local About page.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    for(const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:900},locale:'fa-IR'});
      const page=await context.newPage();
      await page.goto('https://sarvaedu.ir/about',{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(4000);
      const main=page.locator('main.about-module__UxSSNW__page');
      const first=await main.evaluate(m=>{ const h=m.querySelector('h1'),r=h.getBoundingClientRect(),c=getComputedStyle(h);return {heading:h.innerText, rect:{x:r.x,y:r.y,width:r.width,height:r.height}, font:c.fontFamily,fontSize:c.fontSize,faq:m.querySelectorAll('details').length,tabs:m.querySelectorAll('[role=tab]').length}; });
      await main.locator('[role=tab]').last().click(); await page.waitForTimeout(1600);
      const state=await main.locator('.about-module__UxSSNW__dissect').evaluate(e=>({step:e.dataset.step,selected:[...e.querySelectorAll('[role=tab]')].map(t=>t.getAttribute('aria-selected'))}));
      await main.locator('details summary').first().focus(); await page.keyboard.press('Enter');
      const faq=await main.locator('details').first().evaluate(e=>e.open);
      console.log(`::notice title=About${width}::${JSON.stringify({first,state,faq})}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});

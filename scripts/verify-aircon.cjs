const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.BLOG_BASE_URL || 'http://127.0.0.1:5177';
const local = base.includes('127.0.0.1');
const route = '/blog/aircon-check/';
(async()=>{
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('verification/aircon',{recursive:true});
  // Use the currently published list data to test local hydration without modifying the database.
  if(local){
   const html=await (await page.request.get('https://www.jangseongcar.com/car-care/')).text();
   const m=html.match(/window\.__BOARD_DATA__=([\s\S]*?);<\/script>/);
   assert(m,'Live car-care data available');
   fs.writeFileSync('verification/aircon/before-care.json',JSON.stringify(JSON.parse(m[1]),null,2));
   await page.addInitScript(data=>{window.__BOARD_DATA__=data},JSON.parse(m[1]));
  }
  const rawResponse=await page.request.get(base+route); assert.equal(rawResponse.status(),200);
  const raw=await rawResponse.text(); assert(raw.includes('"@type":"BlogPosting"')); assert(raw.includes('rel="canonical"'));
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000});
   await page.goto(base+route,{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('.blog-body figure').count(),6);
   for(const img of await page.locator('.blog-body img').all()){
    await img.scrollIntoViewIfNeeded(); await img.evaluate(e=>e.decode());
    assert(await img.evaluate(e=>e.complete&&e.naturalWidth>=1300&&e.alt.length>8));
   }
   assert((await page.locator('figcaption').allTextContents()).some(t=>t.includes('실제 교체 부품 사진이 아니며')));
   assert.equal(await page.locator('html').evaluate(e=>e.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('.blog-body a[href="tel:0647112882"]').count(),1);
   assert.equal(await page.locator('.blog-body a[href="/contact/#booking"]').count(),1);
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`verification/aircon/${local?'local':'production'}-${width}-top.png`});
   await page.locator('figure').nth(1).screenshot({path:`verification/aircon/${local?'local':'production'}-${width}-reference.png`});
   await page.goto(base+'/blog/',{waitUntil:'networkidle'});
   if(width<=800) await page.locator('.blog-category-toggle').click();
   assert.equal(await page.locator('.blog-card').count(),5);
   for(const [id,count] of Object.entries({all:5,care:3,aircon:1,battery:1,repair:2,'engine-oil':2})){
    const b=page.locator(`[data-category="${id}"]`); assert.equal(await b.locator('small').textContent(),String(count));
    await b.click(); assert.equal(await page.locator('.blog-card:visible').count(),count);
   }
   await page.locator('[data-category="aircon"]').click(); await page.locator('.aircon-check-card').click(); await page.waitForURL('**'+route);
   const careResponse=await page.goto(base+'/car-care/',{waitUntil:'networkidle'}); assert.equal(careResponse.status(),200);
   const card=page.locator('.board-card').filter({has:page.locator(`a[href="${route}"]`)}); assert.equal(await card.count(),1);
   assert(await card.getByText('자세히 보기').isVisible());
   await page.locator('#board-search').fill('에어컨'); assert.equal(await page.locator(`.board-card a[href="${route}"]`).count(),1);
   await page.locator('#board-search').fill('아무글도없는검색어'); assert.equal(await page.locator('.board-card').count(),0);
   await page.locator('#board-search').fill(''); assert.equal(await page.locator(`.board-card a[href="${route}"]`).count(),1);
   assert.equal(await page.locator('html').evaluate(e=>e.scrollWidth>innerWidth),false);
   await page.screenshot({path:`verification/aircon/${local?'local':'production'}-${width}-care.png`});
   await card.getByText('자세히 보기').click(); await page.waitForURL('**'+route);
   console.log(width,'article, 6 images, disclaimer, category counts, car-care search and internal links passed');
  }
  await page.locator('.blog-body a[href="/services/#aircon"]').click(); await page.waitForURL('**/services/#aircon'); assert.equal(await page.locator('article#aircon').count(),1);
  await page.goto(base+route); await page.locator('.blog-body a[href="/contact/#booking"]').click(); await page.waitForURL('**/contact/#booking'); assert.equal(await page.locator('#booking-form').count(),1);
  if(!local){
   const html=await (await page.request.get(base+'/car-care/')).text(); assert(html.includes('href="/blog/aircon-check/"'),'Server-rendered card');
   const sitemap=await (await page.request.get(base+'/sitemap.xml')).text(); assert(sitemap.includes(base+route));
   const before=JSON.parse(fs.readFileSync('verification/aircon/before-care.json','utf8'));
   const after=JSON.parse(html.match(/window\.__BOARD_DATA__=([\s\S]*?);<\/script>/)[1]); assert.deepEqual(after,before,'Existing database posts unchanged');
  }
  assert.deepEqual(errors,[]); console.log('PASS: service and booking navigation without submission; no JavaScript errors');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

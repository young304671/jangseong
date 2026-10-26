const assert=require('node:assert/strict');const fs=require('fs');const cp=require('child_process');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.BLOG_BASE_URL||'http://127.0.0.1:5175';const route='/blog/engine-oil-basic-check/';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('verification/oil',{recursive:true});
const raw=await (await page.request.get(base+route)).text();assert(raw.includes('<h1>엔진오일만 교환하러 왔는데, 왜 다른 곳도 점검할까요?</h1>'));assert.equal((raw.match(/name="description"/g)||[]).length,1);assert.equal((raw.match(/property="og:image"/g)||[]).length,1);assert(raw.includes('"@type":"BlogPosting"'));
for(const width of [1280,768,390,320]){
await page.setViewportSize({width,height:1000});await page.goto(base+route,{waitUntil:'networkidle'});
assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.blog-body h2').count(),5);assert.equal(await page.locator('.blog-body h3').count(),3);assert.equal(await page.locator('tbody tr').count(),5);
const imgs=page.locator('.blog-body img');assert.equal(await imgs.count(),5);
for(let i=0;i<5;i++){await imgs.nth(i).scrollIntoViewIfNeeded();await imgs.nth(i).evaluate(e=>e.decode());const info=await imgs.nth(i).evaluate(e=>({ok:e.complete&&e.naturalWidth>=1254,alt:e.alt,fit:getComputedStyle(e).objectFit,ratio:e.getBoundingClientRect().width/e.getBoundingClientRect().height}));assert(info.ok);assert(info.alt.length>10);assert(Math.abs(info.ratio-1)<.01);}
assert.equal(await page.locator('html').evaluate(e=>e.scrollWidth>innerWidth),false);
assert.equal(await page.locator('.blog-body a[href="/services/#oil"]').count(),1);assert.equal(await page.locator('.blog-body a[href="/contact/#booking"]').count(),1);assert.equal(await page.locator('.original a').getAttribute('href'),'https://blog.naver.com/lpg2882/224408339684');
const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(es=>es.map(e=>JSON.parse(e.textContent)).find(x=>x['@type']==='BlogPosting'));assert.equal(schema.datePublished,'2026-10-26');assert.equal(schema.author.name,'장성카센터');assert.equal(schema.image.length,5);
const body=await page.locator('.blog-body').innerText();assert(!body.includes('[원문'));assert(body.includes('당시 배터리 테스트 결과는 ‘좋음’으로 확인됐습니다.'));
await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`verification/oil/${base.includes('127.')?'local':'production'}-${width}-top.png`,fullPage:false});await page.locator('.oil-check-table').screenshot({path:`verification/oil/${base.includes('127.')?'local':'production'}-${width}-table.png`,style:'header,.mobile-cta{visibility:hidden!important}'});
await page.goto(base+'/blog/',{waitUntil:'networkidle'});if(width<=800)await page.locator('.blog-category-toggle').click();
assert.equal(await page.locator('.blog-card').count(),2);const expected={all:2,repair:1,'engine-oil':1,care:1,'seasonal-check':1};
for(const b of await page.locator('[data-category]').all()){const id=await b.getAttribute('data-category');const count=expected[id]||0;assert.equal(await b.locator('small').textContent(),String(count));await b.click();assert.equal(await page.locator('.blog-card:visible').count(),count);assert.equal(await page.locator('.blog-empty').isVisible(),count===0);}
await page.locator('[data-category="engine-oil"]').click();await page.locator('.oil-check-card').click();await page.waitForURL('**'+route);console.log(width,'images, table, links, schema, 17 category counts and internal detail passed');
}
await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('.blog-body a[href="/services/#oil"]').click();await page.waitForURL('**/services/#oil');assert.equal(await page.locator('article#oil').count(),1);await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('.blog-body a[href="/contact/#booking"]').click();await page.waitForURL('**/contact/#booking');assert.equal(await page.locator('#booking-form').count(),1);console.log('Service anchor and booking destination navigation passed without submission');
if(base.includes('127.')){const live=await browser.newPage();for(const r of ['/blog/summer-check/','/contact/','/services/']){await page.goto(base+r,{waitUntil:'networkidle'});await live.goto('https://www.jangseongcar.com'+r,{waitUntil:'networkidle'});assert.equal(await page.locator('main').innerHTML(),await live.locator('main').innerHTML(),r);}console.log('Existing article, service boxes and booking markup unchanged');}
else{const xml=await (await page.request.get(base+'/sitemap.xml')).text();assert(xml.includes(base+route));console.log('Production sitemap includes article');}
assert.deepEqual(errors,[]);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.BLOG_BASE_URL||'http://127.0.0.1:5174';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('verification/blog',{recursive:true});
for(const width of [1280,768,390,320]){
await page.setViewportSize({width,height:1000});await page.goto(base+'/blog/',{waitUntil:'networkidle'});
const mobile=width<=800;const toggle=page.locator('.blog-category-toggle');
if(mobile){assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#blog-category-nav').isVisible(),false);await toggle.click();}
const buttons=page.locator('[data-category]');assert.equal(await buttons.count(),17);
for(let i=0;i<await buttons.count();i++){
const b=buttons.nth(i);const id=await b.getAttribute('data-category');const count=['all','care','seasonal-check'].includes(id)?1:0;
assert.equal(await b.locator('small').textContent(),String(count));await b.click();
assert.equal(await b.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.blog-card:visible').count(),count);assert.equal(await page.locator('.blog-empty').isVisible(),count===0);
}
await page.locator('[data-category=all]').click();
assert.equal(await page.locator('.blog-card').getAttribute('href'),'/blog/summer-check/');
const bounds=await page.evaluate(()=>{const a=document.querySelector('.blog-categories').getBoundingClientRect(),b=document.querySelector('.blog-list').getBoundingClientRect();return {side:a.right<=b.left,above:a.bottom<=b.top,overflow:document.documentElement.scrollWidth>innerWidth};});
assert.equal(bounds.overflow,false);assert(mobile?bounds.above:bounds.side);
if(mobile){await toggle.click();assert.equal(await page.locator('#blog-category-nav').isVisible(),false);await toggle.click();}
await page.locator('.blog-layout').screenshot({path:`verification/blog/${base.includes('127.')?'local':'production'}-${width}.png`});
await page.locator('.blog-card').click();await page.waitForURL('**/blog/summer-check/');assert(await page.locator('h1').innerText());
console.log(width,JSON.stringify(bounds),'17 categories passed');
}
if(base.includes('127.')){
const live=await browser.newPage();for(const route of ['/blog/summer-check/','/contact/','/services/','/']){
await page.goto(base+route,{waitUntil:'networkidle'});await live.goto('https://www.jangseongcar.com'+route,{waitUntil:'networkidle'});
if(route==='/')for(const p of [page,live])await p.locator('#home-repair-posts,#home-care-posts,.preview-grid .faq').evaluateAll(nodes=>nodes.forEach(n=>n.outerHTML='<div data-dynamic-board></div>')); const a=await page.locator('main').innerHTML(),b=await live.locator('main').innerHTML();if(a!==b){let i=0;while(a[i]===b[i])i++;console.log('DIFFERENCE',route,i,a.slice(i-100,i+180),b.slice(i-100,i+180));}assert.equal(a===b,true,route);}
console.log('Existing article, contact/booking, services and homepage markup unchanged.');}
assert.deepEqual(errors,[]);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

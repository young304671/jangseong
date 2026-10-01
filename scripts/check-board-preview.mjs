import assert from 'node:assert/strict';
const base='http://127.0.0.1:4174';
for(const [path,expected] of [['/car-care/','엔진오일 교환 시기는 언제인가요?'],['/car-care/tire-pressure/','차량에서 확인하세요'],['/repair-cases/brake-pad-replacement/','고객 증상'],['/news/booking-guide/','예약·문의하기'],['/faq/','<details>'],['/blog/summer-check/','냉각수'],['/contact/','id="app"']]) {
  const res=await fetch(base+path);const html=await res.text();assert.equal(res.status,200,path);assert.ok(html.includes(expected),path);if(path.startsWith('/car-care')||path.startsWith('/repair-cases')||path.startsWith('/news'))assert.ok(html.includes('property="og:title"'),path);console.log(`PASS ${path}`);
}
const missing=await fetch(base+'/car-care/not-a-published-post/');assert.equal(missing.status,404);assert.ok((await missing.text()).includes('noindex'));console.log('PASS unpublished/missing detail returns 404');
const invalid=await fetch(base+'/news/a/b/');assert.equal(invalid.status,404);console.log('PASS invalid nested URL returns 404');
const map=await fetch(base+'/sitemap.xml');const xml=await map.text();assert.equal(map.status,200);assert.ok(xml.includes('/car-care/tire-pressure/'));assert.ok(xml.includes('/blog/summer-check/'));assert.ok(!xml.includes('/admin/'));console.log('PASS dynamic published sitemap');

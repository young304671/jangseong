import test from 'node:test';
import assert from 'node:assert/strict';
import { boardRoute, contentHtml, renderBoard, safeImage } from '../board-shared.js';
import { boardMetadata, publicQuery } from '../server/board.js';
import boardPage from '../api/board-page.js';

const post = { title:'<script>alert(1)</script>',slug:'tire-pressure',category:'automotive-care',summary:'Test "summary"',content:'## 점검 내용\n<script>bad()</script>',thumbnail_url:'javascript:alert(1)',images:['javascript:alert(2)','https://example.org/image.jpg'],published_at:'2026-10-01T10:00:00Z' };
test('user content cannot inject HTML, scripts, or unsafe image URLs',()=>{
  const html=renderBoard({category:'automotive-care',slug:'tire-pressure'},{post});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('/contact/#booking'));
  assert.equal(safeImage('data:image/svg+xml,<svg>'), '');
  assert.equal(safeImage('//example.org/image.jpg'), '');
  assert.equal(safeImage('/board-images/care.svg'), '/board-images/care.svg');
  assert.ok(contentHtml('## 점검 내용\n점검했습니다.').includes('<h2>점검 내용</h2>'));
});
test('category and slug routes distinguish detail, listing, FAQ, and invalid paths',()=>{
  assert.deepEqual(boardRoute('/car-care/tire-pressure/'),{category:'automotive-care',slug:'tire-pressure',invalid:false});
  assert.equal(boardRoute('/repair-cases/').category,'repair-case');
  assert.equal(boardRoute('/news/a/b/').invalid,true);assert.equal(boardRoute('/faq/').faq,true);
  assert.equal(boardRoute('/contact/'),null);
});
test('metadata escapes injected tags and serializes JSON safely',()=>{
  const meta=boardMetadata({category:'automotive-care',slug:'tire-pressure'},{post:{...post,title:'</script><script>alert(1)</script>'}});
  assert.ok(meta.includes('property="og:title"'));assert.ok(meta.includes('name="description"'));
  assert.ok(meta.includes('https://www.jangseongcar.com/car-care/tire-pressure/'));
  assert.ok(!meta.includes('</script><script>alert(1)'));
  assert.ok(meta.includes('\\u003c/script>'));
});
test('server always requests published rows with publishable credentials',async()=>{
  const original=global.fetch;const priorUrl=process.env.VITE_SUPABASE_URL;const priorKey=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.VITE_SUPABASE_URL='https://example.supabase.co';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
  global.fetch=async(url,options)=>{assert.equal(url.searchParams.get('published'),'eq.true');assert.equal(options.headers.apikey,'sb_publishable_test');return {ok:true,json:async()=>[]};};
  try{assert.deepEqual(await publicQuery('posts',{category:'eq.news'}),[]);}
  finally{global.fetch=original;if(priorUrl===undefined)delete process.env.VITE_SUPABASE_URL;else process.env.VITE_SUPABASE_URL=priorUrl;if(priorKey===undefined)delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;else process.env.VITE_SUPABASE_PUBLISHABLE_KEY=priorKey;}
});
test('missing/unpublished detail returns real 404 with noindex and prevents stale cache',async()=>{
  const original=global.fetch;const priorUrl=process.env.VITE_SUPABASE_URL;const priorKey=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.VITE_SUPABASE_URL='https://example.supabase.co';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
  global.fetch=async()=>({ok:true,json:async()=>[]});
  const response={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},send(body){this.body=body;}};
  try{await boardPage({url:'/api/board-page?path=/car-care/missing/'},response);assert.equal(response.code,404);assert.ok(response.body.includes('noindex'));assert.ok(response.body.includes('게시물을 찾을 수 없습니다'));assert.equal(response.headers['Cache-Control'],'private, no-store');assert.ok(!response.body.includes('window.__BOARD_DATA__={"posts"'));}
  finally{global.fetch=original;if(priorUrl===undefined)delete process.env.VITE_SUPABASE_URL;else process.env.VITE_SUPABASE_URL=priorUrl;if(priorKey===undefined)delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;else process.env.VITE_SUPABASE_PUBLISHABLE_KEY=priorKey;}
});

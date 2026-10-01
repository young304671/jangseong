// Runs the actual built board HTML functions, with a LOCAL-ONLY booking fixture.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import boardPage from '../api/board-page.js';
import sitemap from '../api/board-sitemap.js';
import { boardRoute } from '../board-shared.js';
import { createHandler } from '../server/booking.js';
process.loadEnvFile('.env.local');
const root = resolve('dist');
const booking = createHandler({env:{GOOGLE_SERVICE_ACCOUNT_JSON:'local-fixture',GOOGLE_SHEETS_ID:'local-fixture',BOOKING_RETENTION_AUTOMATION_READY:'true',BOOKING_ALLOWED_ORIGINS:'http://127.0.0.1:4174'},save:async()=>{console.log('LOCAL BOOKING MOCK: no Google write');}});
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  res.status = code => {res.statusCode=code;return res;};
  res.send = value => res.end(value);
  res.json = value => {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  try {
    const path = new URL(req.url,'http://127.0.0.1:4174').pathname;
    if(path === '/api/booking') {let body='';for await(const chunk of req) body+=chunk;req.body=body||undefined;return booking(req,res);}
    if(path === '/sitemap.xml') return await sitemap(req,res);
    const route = boardRoute(path);
    if(route && !route.admin) return await boardPage(req,res);
    const file = resolve(root, '.' + (path.endsWith('/') ? path+'index.html' : path));
    if(!file.startsWith(root+sep)) return res.status(403).send('Forbidden');
    const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(data);
  } catch {res.status(404).send('Not found');}
}).listen(4174,'127.0.0.1',()=>console.log('Board preview http://127.0.0.1:4174 — booking is a local mock'));

// Local UI test fixture only. Not imported by Vercel or application code.
import http from 'node:http';
import { createServer } from 'vite';
import { createHandler } from '../server/booking.js';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'mpa' });
const stored = new Set();
const handler = createHandler({
  env: { GOOGLE_SERVICE_ACCOUNT_JSON: 'local-fixture', GOOGLE_SHEETS_ID: 'local-fixture', BOOKING_RETENTION_AUTOMATION_READY: 'true', BOOKING_ALLOWED_ORIGINS: 'http://127.0.0.1:4173' },
  save: async data => {
    await new Promise(r => setTimeout(r, 800));
    if (data.symptom.includes('[실패테스트]')) throw new Error('Simulated unavailable storage');
    stored.add(data.requestId);
    console.log(`LOCAL MOCK: ${stored.size} stored request(s); no Google write`);
  },
});
http.createServer(async (req,res)=>{
  if(req.url.split('?')[0] !== '/api/booking') return vite.middlewares(req,res);
  let raw='';for await(const chunk of req)raw+=chunk;
  req.body=raw || undefined;
  res.status=code=>{res.statusCode=code;return res;};
  res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  await handler(req,res);
}).listen(4173,'127.0.0.1',()=>console.log('Local mock preview http://127.0.0.1:4173/contact/#booking'));

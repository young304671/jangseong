import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, policy, validate, rowValues, HEADERS, SUCCESS, ticket } from '../server/booking.js';
import { saveWithSheets } from '../server/google-sheets.js';

const env = { GOOGLE_SERVICE_ACCOUNT_JSON: 'test-only', GOOGLE_SHEETS_ID: 'test-only', BOOKING_RETENTION_AUTOMATION_READY: 'true' };
const valid = () => ({ ...ticket(env), name: '[테스트] 접수 확인', phone: '010-0000-0000', car: '=1+1', year: '', service: '엔진오일과 기본점검', date: '2026-10-01', symptom: '테스트 문의입니다.', agree: true, policyVersion: policy(env).version });
async function call(save, body = valid(), options = {}) {
  const res = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(s) { this.code=s; return this; }, json(v) { this.body=v; return this; } };
  await createHandler({ save, env: options.env || env })({ method: options.method || 'POST', headers: { origin: 'https://jangseong.vercel.app', 'content-type': 'application/json', ...options.headers }, body }, res);
  return res;
}
test('success waits for confirmed persistence', async () => {
  let release;
  const stored = new Promise(r => { release=r; });
  let finished = false;
  const result = call(() => stored).then(r => { finished=true; return r; });
  await new Promise(r => setImmediate(r));
  assert.equal(finished,false);
  release();
  assert.deepEqual((await result).body,{ok:true,message:SUCCESS});
});
test('storage failure gives retry instructions without leaking credentials', async () => {
  const res=await call(async () => { throw new Error('secret-key'); });
  assert.equal(res.code,503);
  assert.equal(res.body.ok,false);
  assert.match(res.body.message,/다시/);
  assert.doesNotMatch(JSON.stringify(res),/secret-key/);
});
test('missing deletion setup, missing consent, foreign origins and malformed fields never save', async () => {
  let calls=0;
  const save=async()=>{calls++;};
  for (const change of [{agree:false},{date:'2026-02-30'},{phone:'bad'},{service:'unknown'},{symptom:'a'.repeat(2001)},{policyVersion:'old'}]) assert.ok((await call(save,{...valid(),...change})).code>=400);
  assert.equal((await call(save,valid(),{env:{...env,BOOKING_RETENTION_AUTOMATION_READY:'false'}})).code,503);
  assert.equal((await call(save,valid(),{headers:{origin:'https://other.example'}})).code,403);
  assert.equal(calls,0);
});
test('public configuration never exposes authentication', async()=>{
  const result=await call(()=>{},null,{method:'GET'});
  assert.deepEqual(Object.keys(result.body).sort(),['ready','retention','ticket','version']);
});
test('expired and forged tickets cannot write', async()=>{
  let calls=0;
  const save=async()=>{calls++;};
  assert.equal((await call(save,{...valid(),...ticket(env,Date.now()-25*3600000)})).code,409);
  assert.equal((await call(save,{...valid(),requestSignature:'0'.repeat(64)})).code,400);
  assert.equal(calls,0);
});
test('Korean timestamp crosses UTC date boundary; status and blank memo match columns',()=>{
  const row=rowValues(validate(valid(),policy(env)),new Date('2026-09-27T16:02:03Z'));
  assert.equal(row.length,11);
  assert.equal(row[0],'2026-09-28 01:02:03');
  assert.equal(row[2],'010-0000-0000');
  assert.deepEqual(row.slice(8),['동의','신규','']);
});
function sheets({timeout=false,wrongHeaders=false,metadata=[]}={}) {
  let marker,rows=[];
  const request=async(path,options)=>{
    if(path.startsWith('/developerMetadata/')) { if(marker)return marker; const error=new Error('missing');error.response={status:404};throw error; }
    if(path.startsWith('/values/')) return {values:[wrongHeaders?['이름']:HEADERS]};
    if(path.startsWith('?fields=developerMetadata')) return {developerMetadata:metadata};
    if(path.startsWith('?')) return {sheets:[{properties:{title:'예약 문의',sheetId:678343994}}]};
    assert.equal(path,':batchUpdate');
    if(marker)throw new Error('Duplicate metadata ID');
    const requests=options.data.requests;
    for(const item of requests.filter(r=>r.deleteDeveloperMetadata)) {
      const id=item.deleteDeveloperMetadata.dataFilter.developerMetadataLookup.metadataId;
      const index=metadata.findIndex(m=>m.metadataId===id);
      if(index!==-1)metadata.splice(index,1);
    }
    marker=requests.find(r=>r.createDeveloperMetadata).createDeveloperMetadata.developerMetadata;
    rows.push(requests.find(r=>r.appendCells).appendCells.rows[0]);
    if(timeout)throw new Error('Timed out after commit');
    return {};
  };
  return {request,rows};
}
test('concurrent double submissions and later retries append exactly one row',async()=>{
  const fake=sheets();const data=validate(valid(),policy(env));
  await Promise.all([saveWithSheets(data,fake.request),saveWithSheets(data,fake.request)]);
  await saveWithSheets(data,fake.request);
  assert.equal(fake.rows.length,1);
  assert.deepEqual(fake.rows[0].values[3],{userEnteredValue:{stringValue:'=1+1'}});
});
test('expired dedup markers are cleaned without deleting current or unrelated markers',async()=>{
  const hour=Math.floor(Date.now()/3600000);
  const metadata=[{metadataId:1,metadataKey:`booking_v1:${hour-60}`},{metadataId:2,metadataKey:`booking_v1:${hour}`},{metadataId:3,metadataKey:'unrelated'}];
  const fake=sheets({metadata});
  await saveWithSheets(validate(valid(),policy(env)),fake.request);
  assert.deepEqual(metadata.map(m=>m.metadataId),[2,3]);
  assert.equal(fake.rows.length,1);
});
test('committed write followed by timeout is recognized as success',async()=>{
  const fake=sheets({timeout:true});
  await saveWithSheets(validate(valid(),policy(env)),fake.request);
  assert.equal(fake.rows.length,1);
});
test('same request ID with changed payload is rejected, and changed headers block writing',async()=>{
  const fake=sheets();const data=validate(valid(),policy(env));
  await saveWithSheets(data,fake.request);
  await assert.rejects(saveWithSheets({...data,name:'changed'},fake.request),{status:409});
  const bad=sheets({wrongHeaders:true});
  await assert.rejects(saveWithSheets(data,bad.request),/headers/);
  assert.equal(bad.rows.length,0);
});

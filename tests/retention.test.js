import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { RETENTION_TEXT } from '../booking-policy.js';
import { policy } from '../server/booking.js';

const code=fs.readFileSync(new URL('../google-apps-script/retention.gs',import.meta.url),'utf8');
function runtime(extra={}) { const context=vm.createContext({Date, ...extra}); vm.runInContext(code,context); return context; }
test('approved notice is identical in the server policy, independent of stale env text',()=>{
  assert.equal(RETENTION_TEXT,'상담 종료 후 3개월간 보관한 뒤 삭제합니다.');
  assert.equal(policy({BOOKING_RETENTION_TEXT:'다른 기간'}).retention,RETENTION_TEXT);
  assert.equal(policy({GOOGLE_SERVICE_ACCOUNT_JSON:'x',GOOGLE_SHEETS_ID:'x'}).ready,false);
});
test('calendar months clamp month ends and preserve Korean time across year/leap boundaries',()=>{
  const r=runtime();
  for(const [input,expected] of [
    ['2026-09-27T15:30:00+09:00','2026-12-27T15:30:00+09:00'],
    ['2026-01-31T23:59:59+09:00','2026-04-30T23:59:59+09:00'],
    ['2026-11-30T08:00:00+09:00','2027-02-28T08:00:00+09:00'],
    ['2027-11-30T08:00:00+09:00','2028-02-29T08:00:00+09:00'],
  ]) assert.equal(r.bookingExpiry_(new Date(input)).toISOString(),new Date(expected).toISOString());
});
test('never deletes early, open consultations or rows without a valid closure timestamp',()=>{
  const r=runtime(); const row=Array(13).fill(''); row[9]='상담 종료'; row[11]=new Date('2026-09-27T15:30:00+09:00');
  assert.equal(r.bookingDue_(row,new Date('2026-12-27T15:29:59+09:00')),false);
  assert.equal(r.bookingDue_(row,new Date('2026-12-27T15:30:00+09:00')),true);
  for(const state of ['신규','연락 완료','예약 확정','완료','취소']) assert.equal(r.bookingDue_(Object.assign([...row],{9:state}),new Date('2027-01-01')),false);
  for(const invalid of ['', '2026-09-27', new Date(NaN)]) assert.equal(r.bookingDue_(Object.assign([...row],{11:invalid}),new Date('2027-01-01')),false);
});
test('purge clears all record values and notes, preserves future/open rows and releases lock',()=>{
  let released=false,flushed=false;const cleared=[];const notes=[];
  const headers=['접수일시','이름','연락처','차종','차량 연식','문의할 정비','희망 방문일','차량 증상','개인정보 동의','처리 상태','상담 메모','상담 종료일시','삭제 예정일시'];
  const old=Object.assign(Array(13).fill('private'),{9:'상담 종료',11:new Date('2020-01-01')});
  const rows=[old,Object.assign([...old],{9:'신규'}),Object.assign([...old],{11:new Date('2099-01-01')})];
  const sheet={getLastRow:()=>4,getRange(row,col,count,width){
    assert.equal(col,1);assert.equal(width,13);
    return {getValues:()=>row===1?[headers]:rows.slice(row-2,row-2+count),clearContent(){cleared.push(row);return this;},clearNote(){notes.push(row);return this;}};
  }};
  const r=runtime({SpreadsheetApp:{openById:()=>({getSpreadsheetTimeZone:()=> 'Asia/Seoul',getSheetByName:()=>sheet}),flush:()=>{flushed=true;}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){released=true;}})},PropertiesService:{getScriptProperties:()=>({setProperty(){}})}});
  assert.equal(r.purgeExpiredBookings().cleared,1);
  assert.deepEqual(cleared,[2]);assert.deepEqual(notes,[2]);assert.equal(released,true);assert.equal(flushed,true);
});
test('trigger installation is idempotent and leaves unrelated triggers alone',()=>{
  const handlers=['unrelated']; let pending;
  const r=runtime({ScriptApp:{getProjectTriggers:()=>handlers.map(h=>({getHandlerFunction:()=>h})),newTrigger(h){pending=h;return {forSpreadsheet(){return this;},onEdit(){return this;},timeBased(){return this;},everyHours(n){assert.equal(n,1);return this;},create(){handlers.push(pending);}};}},PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})}});
  r.bookingSheet_=()=>({});
  r.installBookingRetention();r.installBookingRetention();
  assert.deepEqual(handlers,['unrelated','bookingOnEdit','purgeExpiredBookings']);
});

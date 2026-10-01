/**
 * Bind this script to the booking spreadsheet. Run installBookingRetention once
 * as the owner and approve Google permissions. No web app or secret is needed.
 * No customer data is logged, exported, emailed or copied to another sheet.
 */
const BOOKING_SPREADSHEET_ID = '19QbPYY138vmbJnt-yj3onzSwIX6bXdRv6GTXNXZDCgs';
const BOOKING_TAB = '예약 문의';
const CLOSED_STATUS = '상담 종료';
const BOOKING_RETENTION_HEADERS = ['접수일시','이름','연락처','차종','차량 연식','문의할 정비','희망 방문일','차량 증상','개인정보 동의','처리 상태','상담 메모','상담 종료일시','삭제 예정일시'];

function bookingSheet_() {
  const book = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  if (book.getSpreadsheetTimeZone() !== 'Asia/Seoul') throw new Error('시트 시간대를 Asia/Seoul로 설정해 주세요.');
  const sheet = book.getSheetByName(BOOKING_TAB);
  if (!sheet || JSON.stringify(sheet.getRange(1,1,1,13).getValues()[0]) !== JSON.stringify(BOOKING_RETENTION_HEADERS)) throw new Error('예약 문의 열 구성을 확인해 주세요.');
  return sheet;
}

// Three calendar months, not 90 days. Clamp to the target month's last day.
// Operate in UTC shifted by +09:00 so the script project's timezone is irrelevant.
function bookingExpiry_(closedAt) {
  if (!(closedAt instanceof Date) || !Number.isFinite(closedAt.getTime())) return null;
  const kst = new Date(closedAt.getTime() + 9*3600000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 3;
  const last = new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return new Date(Date.UTC(year,month,Math.min(kst.getUTCDate(),last),kst.getUTCHours(),kst.getUTCMinutes(),kst.getUTCSeconds(),kst.getUTCMilliseconds()) - 9*3600000);
}

function bookingDue_(row, now) {
  // Never guess an end date from submission time or another status.
  const closed = row[11];
  if (row[9] !== CLOSED_STATUS || !(closed instanceof Date) || !Number.isFinite(closed.getTime()) || closed.getTime() > now.getTime()) return false;
  const expiry = bookingExpiry_(closed);
  return expiry !== null && expiry.getTime() <= now.getTime();
}

function bookingOnEdit(event) {
  if (!event || !event.range || !event.source || event.source.getId() !== BOOKING_SPREADSHEET_ID) return;
  const range = event.range;
  if (range.getSheet().getName() !== BOOKING_TAB || range.getLastRow() < 2 || range.getColumn() > 13 || range.getLastColumn() < 10) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = bookingSheet_();
    const start = Math.max(2, range.getRow());
    const count = range.getLastRow() - start + 1;
    const rows = sheet.getRange(start,1,count,13).getValues();
    const now = new Date();
    rows.forEach(function(row, index) {
      const target = sheet.getRange(start+index,12,1,2);
      if (row[9] !== CLOSED_STATUS) {
        // Reopened consultations no longer have an end date.
        if (range.getColumn() <= 10 && range.getLastColumn() >= 10) target.clearContent();
        return;
      }
      let closed = row[11];
      if (closed === '' && range.getColumn() <= 10 && range.getLastColumn() >= 10) closed = now;
      if (!(closed instanceof Date) || !Number.isFinite(closed.getTime()) || closed.getTime() > now.getTime()) {
        target.setNote('상담 종료일시가 없거나 올바르지 않아 자동 삭제하지 않습니다. 실제 상담 종료일시를 확인해 주세요.');
        return;
      }
      target.setValues([[closed,bookingExpiry_(closed)]]).setNumberFormat('yyyy-mm-dd hh:mm:ss').clearNote();
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function purgeExpiredBookings() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let cleared = 0;
  let missingEndDate = 0;
  try {
    const sheet = bookingSheet_();
    const last = sheet.getLastRow();
    if (last < 2) return { cleared:0, missingEndDate:0 };
    const rows = sheet.getRange(2,1,last-1,13).getValues();
    const now = new Date();
    rows.forEach(function(row,index) {
      if (row[9] === CLOSED_STATUS && (!(row[11] instanceof Date) || !Number.isFinite(row[11].getTime()))) { missingEndDate++; return; }
      if (!bookingDue_(row,now)) return;
      const target = sheet.getRange(index+2,1,1,13);
      // Re-read before clearing; skip a row if an operator changed or sorted it.
      const current = target.getValues()[0];
      if (JSON.stringify(current) !== JSON.stringify(row) || !bookingDue_(current,now)) return;
      // Clear the whole record including memo and cell notes, without shifting
      // row indexes underneath a concurrent website append. Keep formatting.
      target.clearContent().clearNote();
      cleared++;
    });
    SpreadsheetApp.flush();
    PropertiesService.getScriptProperties().setProperty('BOOKING_RETENTION_LAST_RUN', now.toISOString());
    if (missingEndDate) throw new Error('상담 종료일시가 누락된 문의가 '+missingEndDate+'건 있습니다. 실제 종료일시를 확인해 주세요.');
    return { cleared:cleared, missingEndDate:missingEndDate };
  } finally { lock.releaseLock(); }
}

function installBookingRetention() {
  bookingSheet_();
  // Idempotent within this owner's account. Preserve unrelated triggers.
  const triggers = ScriptApp.getProjectTriggers();
  if (!triggers.some(function(t){return t.getHandlerFunction()==='bookingOnEdit';})) ScriptApp.newTrigger('bookingOnEdit').forSpreadsheet(BOOKING_SPREADSHEET_ID).onEdit().create();
  if (!triggers.some(function(t){return t.getHandlerFunction()==='purgeExpiredBookings';})) ScriptApp.newTrigger('purgeExpiredBookings').timeBased().everyHours(1).create();
  return verifyBookingRetention();
}

function verifyBookingRetention() {
  bookingSheet_();
  const handlers = ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
  return { editTrigger:handlers.includes('bookingOnEdit'), deletionTrigger:handlers.includes('purgeExpiredBookings'), lastRun:PropertiesService.getScriptProperties().getProperty('BOOKING_RETENTION_LAST_RUN') };
}

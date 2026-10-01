import { GoogleAuth } from 'google-auth-library';
import { BookingError, HEADERS, hash, rowValues } from './booking.js';

export async function saveBooking(data, env) {
  const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const client = await auth.getClient();
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_ID)}`;
  const request = async (suffix, options = {}) => (await client.request({ url: base + suffix, timeout: 10000, retry: false, ...options })).data;
  return saveWithSheets(data, request);
}

export async function saveWithSheets(data, request) {
  // This ID is a spreadsheet-wide uniqueness constraint. Both operations below
  // are atomic: competing retries cannot append without creating this marker.
  const metadataId = (parseInt(hash(data.requestId).slice(0, 8), 16) & 0x7fffffff) || 1;
  const marker = Buffer.from(hash(JSON.stringify(data)), 'hex').toString('base64url');
  const markerKey = `booking_v1:${Math.floor(data.requestCreatedAt / 3600000)}`;
  const existing = async () => {
    try {
      const found = await request(`/developerMetadata/${metadataId}`);
      if (found.metadataKey === markerKey && found.metadataValue === marker) return true;
      throw new BookingError(409, '접수 번호와 입력 내용이 일치하지 않습니다. 이전 접수 여부를 확인한 후 페이지를 새로 열어 주세요.');
    } catch (error) {
      if (error.response?.status === 404) return false;
      throw error;
    }
  };
  if (await existing()) return;
  const header = await request(`/values/${encodeURIComponent("'예약 문의'!A1:K1")}`);
  if (JSON.stringify(header.values?.[0]) !== JSON.stringify(HEADERS)) throw new Error('Sheet headers do not match');
  const book = await request('?fields=sheets(properties(sheetId,title))');
  const sheetId = book.sheets?.find(s => s.properties.title === '예약 문의')?.properties.sheetId;
  if (!Number.isInteger(sheetId)) throw new Error('Booking tab missing');
  // Tickets expire after 24h. Keep markers for >48h so deleting an expired
  // marker can never allow a valid retry to append again. Customer rows stay.
  const metadata = await request('?fields=developerMetadata(metadataId,metadataKey)');
  const expired = (metadata.developerMetadata || []).filter(item => /^booking_v1:\d+$/.test(item.metadataKey) && Number(item.metadataKey.split(':')[1]) < Math.floor((Date.now() - 48 * 3600000) / 3600000));
  const cleanup = expired.map(item => ({ deleteDeveloperMetadata: { dataFilter: { developerMetadataLookup: { metadataId: item.metadataId } } } }));
  try {
    await request(':batchUpdate', { method: 'POST', data: { requests: [
      ...cleanup,
      { createDeveloperMetadata: { developerMetadata: { metadataId, metadataKey: markerKey, metadataValue: marker, location: { spreadsheet: true }, visibility: 'DOCUMENT' } } },
      { appendCells: { sheetId, rows: [{ values: rowValues(data).map(value => ({ userEnteredValue: { stringValue: value } })) }], fields: 'userEnteredValue' } },
    ] } });
  } catch (error) {
    // A timeout may happen after Google commits. Read the durable marker before
    // reporting failure; the next retry uses the same marker if Google is down.
    if (await existing()) return;
    throw error;
  }
}

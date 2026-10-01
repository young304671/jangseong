import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { RETENTION_TEXT } from '../booking-policy.js';

export const HEADERS = ['접수일시', '이름', '연락처', '차종', '차량 연식', '문의할 정비', '희망 방문일', '차량 증상', '개인정보 동의', '처리 상태', '상담 메모'];
export const SERVICES = ['엔진오일과 기본점검', '타이어 점검과 교체', '배터리 점검과 교체', '자동차 에어컨 점검', '브레이크와 하체 점검', '각종 소모품과 기본정비', '증상을 잘 모르겠어요'];
export const SUCCESS = '예약 문의가 접수되었습니다. 확인 후 연락드리겠습니다. 방문 일정은 상담 후 확정됩니다.';
const FAILURE = '저장 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 ‘예약 문의 접수’를 다시 눌러 주세요. 같은 문의는 중복 저장되지 않습니다.';
export const hash = value => createHash('sha256').update(value).digest('hex');
const DAY = 86400000;
const signature = (id, time, env) => createHmac('sha256', env.BOOKING_WEBHOOK_SECRET || env.GOOGLE_SERVICE_ACCOUNT_JSON || '').update(`${id}:${time}`).digest('hex');
export function ticket(env, now = Date.now()) {
  const requestId = randomUUID();
  return { requestId, requestCreatedAt: now, requestSignature: signature(requestId, now, env) };
}
function validateTicket(body, env) {
  const time = body.requestCreatedAt;
  const signed = body.requestSignature;
  if (!Number.isSafeInteger(time) || time > Date.now() + 60000 || Date.now() - time > DAY) throw new BookingError(409, '접수 화면의 유효 시간이 지났습니다. 이전에 접수를 시도했다면 접수 여부를 확인한 뒤 새 문의를 작성해 주세요.');
  const expected = signature(body.requestId, time, env);
  if (typeof signed !== 'string' || !/^[a-f0-9]{64}$/.test(signed) || !timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) throw new BookingError(400, '접수 번호를 확인할 수 없습니다. 페이지를 새로 열어 주세요.');
}
export class BookingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function policy(env) {
  const retention = RETENTION_TEXT;
  return { retention, version: hash(`booking-v1:${retention}`), ready: Boolean(env.BOOKING_APPS_SCRIPT_URL && env.BOOKING_WEBHOOK_SECRET) || Boolean(env.BOOKING_RETENTION_AUTOMATION_READY === 'true' && env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GOOGLE_SHEETS_ID) };
}
export function validate(body, currentPolicy) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BookingError(400, '입력 내용을 확인해 주세요.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) throw new BookingError(400, '접수 번호가 올바르지 않습니다. 페이지를 새로 열어 다시 입력해 주세요.');
  if (body.agree !== true) throw new BookingError(400, '개인정보 수집·이용 동의를 확인해 주세요.');
  if (body.policyVersion !== currentPolicy.version) throw new BookingError(409, '개인정보 안내가 변경되었습니다. 페이지를 새로 열어 안내를 확인한 후 다시 접수해 주세요.');
  const data = {};
  for (const [key, max] of Object.entries({ name: 80, phone: 30, car: 100, year: 20, service: 80, date: 10, symptom: 2000 })) {
    if (typeof body[key] !== 'string' || body[key].trim().length > max || (key !== 'year' && !body[key].trim())) throw new BookingError(400, '필수 항목과 입력 길이를 확인해 주세요.');
    data[key] = body[key].trim();
  }
  if (!/^0\d{8,10}$/.test(data.phone.replace(/[\s()-]/g, ''))) throw new BookingError(400, '연락 가능한 전화번호를 확인해 주세요.');
  if (!SERVICES.includes(data.service)) throw new BookingError(400, '문의할 정비를 선택해 주세요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date) throw new BookingError(400, '희망 방문일을 확인해 주세요.');
  return { ...data, agree: true, policyVersion: body.policyVersion, requestId: body.requestId.toLowerCase(), requestCreatedAt: body.requestCreatedAt };
}
export function rowValues(data, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  const stamp = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
  return [stamp, data.name, data.phone, data.car, data.year, data.service, data.date, data.symptom, '동의', '신규', ''];
}
export function createHandler({ save, env = process.env }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const currentPolicy = policy(env);
    if (req.method === 'GET') return res.status(200).json({ ...currentPolicy, ...(currentPolicy.ready ? { ticket: ticket(env) } : {}) });
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ ok: false, message: '지원하지 않는 요청입니다.' }); }
    try {
      const allowed = (env.BOOKING_ALLOWED_ORIGINS || 'https://www.jangseongcar.com,https://jangseong.vercel.app').split(',').map(s => s.trim());
      if (!allowed.includes(req.headers.origin)) throw new BookingError(403, '홈페이지에서 다시 접수해 주세요.');
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new BookingError(415, '올바른 형식으로 다시 접수해 주세요.');
      if (Buffer.byteLength(JSON.stringify(req.body ?? '')) > 16000) throw new BookingError(413, '입력 내용이 너무 깁니다. 차량 증상을 2,000자 이내로 줄여 주세요.');
      if (!currentPolicy.ready) throw new BookingError(503, '현재 온라인 접수 준비 중입니다. 잠시 후 다시 이용해 주세요. 문의는 저장되지 않았습니다.');
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { throw new BookingError(400, '입력 내용을 확인해 주세요.'); } }
      const data = validate(body, currentPolicy);
      validateTicket(body, env);
      await save(data, env);
      return res.status(200).json({ ok: true, message: SUCCESS });
    } catch (error) {
      // Never log request bodies, Google responses, tokens or customer information.
      return res.status(error instanceof BookingError ? error.status : 503).json({ ok: false, message: error instanceof BookingError ? error.message : env.BOOKING_APPS_SCRIPT_URL ? '접수 결과를 확인하지 못했습니다. 입력 내용을 유지했습니다. 다시 시도하기 전에 매장에 접수 여부를 확인해 주세요.' : FAILURE });
    }
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { saveWithAppsScript } from '../server/apps-script.js';
import { policy, ticket, createHandler } from '../server/booking.js';
const env = { BOOKING_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test-only/exec', BOOKING_WEBHOOK_SECRET: 'test-secret' };
test('existing production environment supports the booking form without Sheets credentials', async () => {
  assert.equal(policy(env).ready, true);
  let saved;
  const body = { ...ticket(env), policyVersion: policy(env).version, name: '테스트', phone: '01012345678', car: '아반떼', year: '', service: '엔진오일과 기본점검', date: '2026-10-01', symptom: '점검 문의', agree: true };
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.body = value; } };
  await createHandler({ env, save: async data => { saved = data; } })({ method: 'POST', headers: { origin: 'https://www.jangseongcar.com', 'content-type': 'application/json' }, body }, res);
  assert.equal(res.code, 200);
  assert.equal(saved.requestId, body.requestId);
});
test('webhook keeps the deployed payload and requires confirmed storage', async () => {
  const data = { requestId: 'same-id', name: ' 테스트 ', phone: '01012345678', car: '차량', service: '점검', date: '2026-10-01', symptom: '증상', year: '', policyVersion: 'must-not-forward' };
  await saveWithAppsScript(data, env, async (url, options) => {
    assert.equal(url.hostname, 'script.google.com');
    const payload = JSON.parse(options.body);
    assert.equal(payload.name, '테스트');
    assert.equal(payload.secret, env.BOOKING_WEBHOOK_SECRET);
    assert.equal(payload.requestId, data.requestId);
    assert.equal(payload.agree, true);
    assert.equal(payload.policyVersion, undefined);
    return { ok: true, json: async () => ({ ok: true }) };
  });
  await assert.rejects(saveWithAppsScript(data, env, async () => ({ ok: true, json: async () => ({ ok: false }) })));
  await assert.rejects(saveWithAppsScript(data, { ...env, BOOKING_APPS_SCRIPT_URL: 'https://other.example/exec' }, async () => { throw new Error('must never fetch'); }));
});

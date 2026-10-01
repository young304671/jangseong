import { RETENTION_TEXT } from './booking-policy.js';

export function initBookingForm(form) {
  if (!form) return;
  const message = form.querySelector('.form-msg');
  const button = form.querySelector('[type="submit"]');
  const retention = form.querySelector('[data-retention]');
  retention.textContent = RETENTION_TEXT;
  let busy = false;
  let submitted = false;
  let pending = null;
  let config;
  const show = (text, state = 'error') => {
    message.textContent = text;
    message.className = `form-msg ${state}`;
  };
  const loadPolicy = async () => {
    const response = await fetch('/api/booking', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error();
    const value = await response.json();
    if (!value.retention || !value.version || !value.ready || !value.ticket) throw new Error();
    retention.textContent = value.retention;
    config = value;
    return value;
  };
  const policyLoaded = loadPolicy().catch(() => {
    retention.textContent = RETENTION_TEXT;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || submitted) return;
    if (!form.checkValidity()) { form.reportValidity(); show('필수 항목과 개인정보 동의를 확인해 주세요.'); return; }
    busy = true;
    button.disabled = true;
    button.textContent = '접수 중…';
    form.setAttribute('aria-busy', 'true');
    try {
      await policyLoaded;
      if (!config) {
        await loadPolicy();
        form.elements.agree.checked = false;
        show('개인정보 안내를 불러왔습니다. 안내를 확인하고 다시 동의한 후 접수해 주세요.');
        return;
      }
      if (!pending) {
        const values = Object.fromEntries(new FormData(form));
        pending = { ...values, agree: form.elements.agree.checked, ...config.ticket, policyVersion: config.version };
      }
      // Freeze the original request after an uncertain result. Retrying must not
      // accidentally send changed details with a new ID after a committed write.
      form.querySelectorAll('input, select, textarea').forEach(el => { el.disabled = true; });
      show('문의 내용을 저장하고 있습니다.', '');
      const response = await fetch('/api/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending), signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if ([400, 403, 409, 413, 415].includes(response.status)) {
          pending = null;
          form.querySelectorAll('input, select, textarea').forEach(el => { el.disabled = false; });
        }
        show(result.message || '저장하지 못했습니다. 잠시 후 다시 접수해 주세요.');
        return;
      }
      submitted = true;
      form.reset();
      show('예약 문의가 접수되었습니다. 확인 후 연락드리겠습니다. 방문 일정은 상담 후 확정됩니다.', 'success');
    } catch {
      show(config ? '접수 결과를 확인하지 못했습니다. 입력 내용을 유지했습니다. 다시 시도하기 전에 매장에 접수 여부를 확인해 주세요.' : '현재 온라인 접수를 이용할 수 없습니다. 잠시 후 다시 눌러 주세요. 문의는 저장되지 않았습니다.');
    } finally {
      busy = false;
      button.disabled = submitted;
      button.textContent = submitted ? '접수 완료' : '예약 문의 접수';
      form.setAttribute('aria-busy', 'false');
    }
  });
}

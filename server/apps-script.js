// Preserve the production webhook payload used by young304671/jangseong.
export async function saveWithAppsScript(data, env, request = fetch) {
  const endpoint = new URL(env.BOOKING_APPS_SCRIPT_URL);
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !endpoint.pathname.startsWith('/macros/s/') || !endpoint.pathname.endsWith('/exec') || !env.BOOKING_WEBHOOK_SECRET) throw new Error('Invalid booking configuration');
  const fields = ['requestId', 'name', 'phone', 'car', 'service', 'date', 'symptom', 'year'];
  const submission = { ...Object.fromEntries(fields.map(key => [key, String(data[key] ?? '').trim()])), agree: true, secret: env.BOOKING_WEBHOOK_SECRET };
  const response = await request(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(submission), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || (await response.json()).ok !== true) throw new Error('Booking storage not confirmed');
}

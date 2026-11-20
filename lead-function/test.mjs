// Локальная проверка функции без настоящего бота: node lead-function/test.mjs
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sent = []
globalThis.fetch = async (url, opt) => { sent.push({ url: url.replace(/bot[^/]+/, 'bot<ключ>'), body: JSON.parse(opt.body) }); return { ok: true, status: 200 } }
process.env.TG_TOKEN = 'test'; process.env.TG_CHAT_ID = '-1001;-1002'; process.env.ALLOWED_ORIGINS = 'https://andrewmironov13.github.io;http://127.0.0.1:5292'
const { handler, _test } = require('./src/index.js')
const ev = (body, origin = 'https://andrewmironov13.github.io', method = 'POST', ip = '1.1.1.1') => ({ httpMethod: method, headers: { Origin: origin, 'Content-Type': 'text/plain' }, body: typeof body === 'string' ? body : JSON.stringify(body), isBase64Encoded: false, requestContext: { identity: { sourceIp: ip } } })
const lead = { services: ['тонировка', 'сигнализация', 'электропривод багажника'], kit: 'базовый минимум для иномарки', car: 'Toyota Camry <script>', year: '2021 и новее', phone: '8 (900) 123-45-67', name: 'Иван', page: 'https://x/', tab: 'start', company: '' }
const cases = [
  ['обычная заявка', ev(lead), 200, 2],
  ['ловушка заполнена', ev({ ...lead, company: 'spam' }), 200, 0],
  ['чужой сайт', ev(lead, 'https://evil.example'), 403, 0],
  ['нет телефона', ev({ ...lead, phone: '123' }), 422, 0],
  ['битый JSON', ev('{nope'), 400, 0],
  ['OPTIONS', ev('', 'https://andrewmironov13.github.io', 'OPTIONS'), 204, 0],
  ['GET', ev('', 'https://andrewmironov13.github.io', 'GET'), 405, 0],
  ['base64', { ...ev(lead), body: Buffer.from(JSON.stringify(lead)).toString('base64'), isBase64Encoded: true }, 200, 2],
]
let fail = 0
for (const [name, e, code, msgs] of cases) {
  sent.length = 0
  const r = await handler(e)
  const ok = r.statusCode === code && sent.length === msgs
  if (!ok) fail++
  console.log(ok ? 'ок ' : 'ОШИБКА', name, r.statusCode, `сообщений ${sent.length}`, r.headers['Access-Control-Allow-Origin'])
}
// шестая заявка с одного адреса за 10 минут — отбой
let last
for (let i = 0; i < 6; i++) last = await handler(ev(lead, undefined, 'POST', '9.9.9.9'))
console.log(last.statusCode === 429 ? 'ок ' : 'ОШИБКА', 'шестая подряд', last.statusCode); if (last.statusCode !== 429) fail++
console.log('\nТелефоны:', ['89001234567', '+7 900 123 45 67', '9001234567', '12'].map(_test.phoneOf))
console.log('\nТак выглядит сообщение в группе:\n' + _test.message(lead))
process.exit(fail ? 1 : 0)

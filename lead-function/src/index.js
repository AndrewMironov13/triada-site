// Приём заявок с сайта ТРИАДЫ → группа «Заявки ТРИАДА» в Telegram.
// Yandex Cloud Functions, среда nodejs22, точка входа index.handler, без зависимостей.
//
// Переменные окружения функции:
//   TG_TOKEN         — ключ бота от @BotFather
//   TG_CHAT_ID       — id группы (минус в начале); несколько групп — через «;»
//   ALLOWED_ORIGINS  — сайты, с которых принимаем заявки, через «;» (https://andrewmironov13.github.io;https://домен)
//   TG_API           — куда слать запросы Bot API. Из Yandex Cloud api.telegram.org не открывается (РФ режет Telegram),
//                      поэтому идём через посредника на Cloudflare (tg-relay/), без него — напрямую
//
// Сайт шлёт POST с Content-Type: text/plain, а тело — JSON. Это «простой» запрос, браузер не делает
// предварительный OPTIONS, поэтому про CORS-preflight Yandex Cloud можно не думать. OPTIONS всё равно отвечаем
'use strict'

const LIMIT = { services: 400, kit: 200, car: 80, year: 20, phone: 32, name: 60, page: 300, tab: 20, from: 80 }
const TABS = { start: 'Автозапуск', signal: 'Сигнализации', audio: 'Автозвук', light: 'Подсветка', radio: 'Магнитолы', noise: 'Шумоизоляция' }
const split = (v) => String(v || '').split(/[;\s]+/).map((x) => x.trim()).filter(Boolean)

// защита от пачки заявок с одного адреса: не больше 5 за 10 минут (в пределах одного экземпляра функции)
const seen = new Map()
function tooMany(ip) {
  if (!ip) return false
  const now = Date.now(), win = 10 * 60 * 1000
  const list = (seen.get(ip) || []).filter((t) => now - t < win)
  list.push(now); seen.set(ip, list)
  if (seen.size > 500) for (const [k, v] of seen) if (now - v[v.length - 1] > win) seen.delete(k)
  return list.length > 5
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cut = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

// +7 900 123-45-67 из любых «8 (900) 123 45 67», «9001234567»
function phoneOf(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1)
  if (d.length === 10) d = '7' + d
  if (d.length === 11 && d[0] === '7') return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`
  return d.length >= 10 && d.length <= 15 ? '+' + d : ''
}

function saratovTime(date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Saratov', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date).replace(',', ' в')
}

function message(lead) {
  const services = (Array.isArray(lead.services) ? lead.services : []).map((s) => cut(s, 60)).filter(Boolean).join(', ')
  const car = [cut(lead.car, LIMIT.car), cut(lead.year, LIMIT.year)].filter(Boolean).join(', ')
  const tab = TABS[lead.tab] || ''
  const rows = ['<b>Заявка с сайта</b>']
  if (services) rows.push(`Что ставим: ${esc(cut(services, LIMIT.services))}`)
  if (cut(lead.kit, LIMIT.kit)) rows.push(`В заявке: ${esc(cut(lead.kit, LIMIT.kit))}`)
  if (car) rows.push(`Машина: ${esc(car)}`)
  rows.push(`Телефон: ${esc(phoneOf(lead.phone))}`)
  if (cut(lead.name, LIMIT.name)) rows.push(`Имя: ${esc(cut(lead.name, LIMIT.name))}`)
  // откуда заявка: где нажали кнопку (сайт присылает from); у старых версий сайта — вкладка первого экрана
  const from = cut(lead.from, LIMIT.from) || (tab ? `открыта вкладка «${tab}»` : '')
  rows.push('', `<i>${saratovTime()} по Саратову${from ? ` · ${esc(from)}` : ''}</i>`)
  return rows.join('\n')
}

async function sendTelegram(token, chatId, text) {
  const api = (process.env.TG_API || 'https://api.telegram.org').replace(/\/$/, '')
  const r = await fetch(`${api}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`telegram ${r.status}`)
}

function reply(status, origin, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin || 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
    body: JSON.stringify(body),
  }
}

module.exports.handler = async function handler(event) {
  const h = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]))
  const origin = h.origin || ''
  const allowed = split(process.env.ALLOWED_ORIGINS)
  const okOrigin = allowed.includes(origin) ? origin : ''

  if (event.httpMethod === 'OPTIONS') return reply(204, okOrigin, {})
  if (event.httpMethod !== 'POST') return reply(405, okOrigin, { ok: false, error: 'method' })
  // заявки принимаем только со своих сайтов (чужая страница в браузере не подделает Origin)
  if (!okOrigin) return reply(403, '', { ok: false, error: 'origin' })

  let lead
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '')
    if (raw.length > 5000) return reply(413, okOrigin, { ok: false, error: 'size' })
    lead = JSON.parse(raw)
  } catch { return reply(400, okOrigin, { ok: false, error: 'json' }) }
  if (!lead || typeof lead !== 'object') return reply(400, okOrigin, { ok: false, error: 'json' })

  // поле-ловушка: человек его не видит, бот заполняет. Отвечаем «ок», но никуда не шлём
  if (cut(lead.company, 100)) return reply(200, okOrigin, { ok: true })
  if (!phoneOf(lead.phone)) return reply(422, okOrigin, { ok: false, error: 'phone' })
  if (tooMany(event.requestContext?.identity?.sourceIp)) return reply(429, okOrigin, { ok: false, error: 'rate' })

  const token = process.env.TG_TOKEN, chats = split(process.env.TG_CHAT_ID)
  if (!token || !chats.length) return reply(500, okOrigin, { ok: false, error: 'config' })
  const text = message(lead)
  const sent = await Promise.allSettled(chats.map((c) => sendTelegram(token, c, text)))
  const delivered = sent.filter((s) => s.status === 'fulfilled').length
  if (!delivered) {
    // причина без ключа бота: код ответа Telegram или сетевая ошибка (логи функции выключены, поэтому отдаём её в ответе)
    const why = sent.map((s) => { const e = s.reason || {}; return [e.message, e.cause?.code, e.cause?.message].filter(Boolean).join(' / ').replace(/bot[^/\s]+/g, 'bot<ключ>').slice(0, 200) })
    return reply(502, okOrigin, { ok: false, error: 'telegram', why })
  }
  return reply(200, okOrigin, { ok: true })
}

// для локальной проверки
module.exports._test = { phoneOf, message }

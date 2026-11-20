// Посредник к Telegram Bot API для функции заявок в Yandex Cloud: из российского облака api.telegram.org
// не открывается (проверено 20.11.2026, таймаут), а Cloudflare открывается за ~150 мс.
// Пропускает только sendMessage нашего бота @triada_leads_bot. Ключ бота здесь не хранится — он приходит в пути запроса
const BOTS = ['9231780577']

export default {
  async fetch(req) {
    const { pathname } = new URL(req.url)
    const m = pathname.match(/^\/bot(\d+):[A-Za-z0-9_-]+\/sendMessage$/)
    if (req.method !== 'POST' || !m || !BOTS.includes(m[1])) return new Response('{"ok":false}', { status: 403, headers: { 'Content-Type': 'application/json' } })
    const body = await req.text()
    if (body.length > 8000) return new Response('{"ok":false}', { status: 413, headers: { 'Content-Type': 'application/json' } })
    const r = await fetch('https://api.telegram.org' + pathname, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json' } })
  },
}

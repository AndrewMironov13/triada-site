// Сквозная проверка в браузере: собранный сайт → функция → поддельный Telegram.
// node lead-function/e2e.mjs <папка сборки с VITE_LEAD_URL=http://127.0.0.1:5299/>
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { createRequire } from 'node:module'
import { chromium } from '/Users/andrew/.local/lib/node_modules/playwright/index.mjs'
const require = createRequire(import.meta.url)
const dist = process.argv[2]
const tg = []
const realFetch = globalThis.fetch
globalThis.fetch = async (url, opt) => { if (String(url).includes('api.telegram.org')) { tg.push(JSON.parse(opt.body)); return { ok: true, status: 200 } } return realFetch(url, opt) }
process.env.TG_TOKEN = 'test'; process.env.TG_CHAT_ID = '-100500'; process.env.ALLOWED_ORIGINS = 'http://127.0.0.1:5298'
const { handler } = require('./src/index.js')
const seenMethods = []
const fn = http.createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c
  seenMethods.push(req.method + ' ' + (req.headers['content-type'] || ''))
  const r = await handler({ httpMethod: req.method, headers: req.headers, body, isBase64Encoded: false, requestContext: { identity: { sourceIp: '127.0.0.1' } } })
  res.writeHead(r.statusCode, r.headers); res.end(r.body)
}).listen(5299)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const site = http.createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]); const f = join(dist, p.endsWith('/') ? p + 'index.html' : p)
  try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() }
}).listen(5298)
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://127.0.0.1:5298/?static', { waitUntil: 'networkidle' })
await p.locator('#minimum [data-book]').first().click(); await p.waitForTimeout(400)
await p.locator('#book [name=car]').fill('Kia Sportage')
await p.locator('#book [data-book-year] label').nth(2).click()
await p.locator('#book [name=phone]').fill('8 900 123 45 67'); await p.locator('#book [name=name]').fill('Тест')
await p.locator('#book .book__send').click(); await p.waitForTimeout(800)
const ui = await p.evaluate(() => ({ ok: !document.querySelector('[data-book-ok]').hidden, demo: !!document.querySelector('.book__demo'), err: document.querySelector('[data-book-err]').hidden ? '' : document.querySelector('[data-book-err]').textContent }))
console.log(JSON.stringify({ ui, methods: seenMethods, errs }, null, 1))
console.log('\nВ Telegram ушло:\n' + (tg[0]?.text || 'НИЧЕГО'))
await b.close(); fn.close(); site.close()
process.exit(ui.ok && tg.length === 1 && !seenMethods.some((m) => m.startsWith('OPTIONS')) ? 0 : 1)

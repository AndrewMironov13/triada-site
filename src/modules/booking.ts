// Окно записи: что ставим (отмечено заранее по вкладке или строке услуги), машина, год, телефон, имя.
// Заявка уходит POST-запросом на VITE_LEAD_URL — это бот, который пересылает её в MAX и Telegram.
// Пока адреса нет: на localhost окно показывает «Заявка у нас» (для проверки), на сайте честно просит позвонить
import { SERVICES, SITE, LEVELS } from '../site.config'
import { currentTab, currentLevel } from './hero'
import { calcState } from './calc'
import { goal, reduceMotion, mqMobile } from './env'

const LEAD_URL = import.meta.env.VITE_LEAD_URL as string | undefined
const local = /^(localhost|127\.)/.test(location.hostname)
// демо на GitHub Pages (VITE_DEMO=1): окно показывает «Заявка у нас» и честно пишет, что бот ещё не подключён
const DEMO = import.meta.env.VITE_DEMO === '1'

export function initBooking() {
  const dlg = document.getElementById('book') as HTMLDialogElement | null
  if (!dlg) return
  const form = dlg.querySelector<HTMLFormElement>('[data-book-form]')!
  const chips = dlg.querySelector<HTMLElement>('[data-book-svc]')!
  const kitLine = dlg.querySelector<HTMLElement>('[data-book-kit]')!
  const err = dlg.querySelector<HTMLElement>('[data-book-err]')!
  const ok = dlg.querySelector<HTMLElement>('[data-book-ok]')!
  const send = dlg.querySelector<HTMLButtonElement>('.book__send')!
  const yearSeg = dlg.querySelector<HTMLElement>('[data-book-year]')!
  const el = (n: string) => form.elements.namedItem(n) as HTMLInputElement
  const picked = new Set<string>()
  let kit = ''

  chips.innerHTML = SERVICES.map((s) => `<button class="chip" type="button" aria-pressed="false" data-k="${s.key}">${s.chip}</button>`).join('')
  const chipEls = [...chips.querySelectorAll<HTMLButtonElement>('.chip')]
  const sync = () => chipEls.forEach((c) => { const on = picked.has(c.dataset.k!); c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)) })
  chipEls.forEach((c) => c.addEventListener('click', () => { const k = c.dataset.k!; picked.has(k) ? picked.delete(k) : picked.add(k); sync() }))

  let opener: HTMLElement | null = null
  function open(from: HTMLElement) {
    opener = from
    dlg!.classList.remove('done'); ok.hidden = true; err.hidden = true
    picked.clear(); kit = ''
    // data-svc — одна услуга или несколько через запятую («Базовый минимум»), data-kit — строка «В заявке»
    const svc = from.dataset.svc
    if (from.dataset.from === 'calc') {
      // из подбора: модель, цена и машина переезжают в заявку
      const s = calcState(); picked.add(currentTab() === 'start' ? 'start' : 'signal')
      if (s) {
        kit = `${s.model}, ${s.what}, от ${s.price.toLocaleString('ru-RU')} ₽`
        if (s.car) el('car').value = s.car
        if (s.year) yearSeg.querySelectorAll<HTMLInputElement>('input').forEach((i) => { i.checked = i.value === s.year })
      }
    } else if (svc) {
      svc.split(',').forEach((k) => picked.add(k))
      if (from.dataset.kit) kit = from.dataset.kit
    }
    else if (from.closest('.hero')) {
      picked.add(currentTab())
      if (currentTab() === 'audio') kit = `${LEVELS[currentLevel - 1].label.toLowerCase()}: ${LEVELS[currentLevel - 1].what.toLowerCase()}`
    }
    kitLine.hidden = !kit
    kitLine.innerHTML = kit ? `В заявке: <b>${kit}</b>` : ''
    sync()
    dlg!.showModal()
    document.documentElement.classList.add('is-locked')
    goal('book_open')
    if (!reduceMotion) {
      const p = form
      p.animate([{ opacity: 0, transform: mqMobile.matches ? 'translateY(30%)' : 'translateY(2rem)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' })
    }
    setTimeout(() => (el('car').value ? el('phone') : el('car')).focus({ preventScroll: true }), 50)
  }
  function close() { if (dlg!.open) dlg!.close() }
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('is-locked'); opener?.focus({ preventScroll: true }) })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close() })
  dlg.querySelectorAll('[data-book-close]').forEach((b) => b.addEventListener('click', close))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    err.hidden = true
    const phone = el('phone').value.trim()
    const year = yearSeg.querySelector<HTMLInputElement>('input:checked')?.value ?? ''
    if (!year) { yearSeg.classList.remove('ask'); void yearSeg.offsetWidth; yearSeg.classList.add('ask'); err.textContent = 'Выберите год выпуска — от него зависит, что подойдёт'; err.hidden = false; return }
    if (phone.replace(/\D/g, '').length < 10) { err.textContent = 'Оставьте телефон, чтобы мы перезвонили'; err.hidden = false; el('phone').focus(); return }
    const lead = {
      services: SERVICES.filter((s) => picked.has(s.key)).map((s) => s.msg),
      kit, car: el('car').value.trim(), year, phone, name: el('name').value.trim(),
      page: location.href, tab: currentTab(),
      company: el('company').value, // поле-ловушка для ботов, человек его не видит
    }
    send.disabled = true
    try {
      if (LEAD_URL) {
        // text/plain — «простой» запрос: браузер не шлёт предварительный OPTIONS, функция в Yandex Cloud получает сразу POST
        const r = await fetch(LEAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(lead) })
        if (r.status === 422) { err.textContent = 'Проверьте телефон: нужен номер из 10–11 цифр'; err.hidden = false; el('phone').focus(); return }
        if (!r.ok) throw new Error(String(r.status))
      } else if (!local && !DEMO) {
        throw new Error('no-endpoint')
      } else console.info('[заявка, локально не отправляется]', lead)
      goal('lead'); dlg!.classList.add('done'); ok.hidden = false
      if (DEMO && !LEAD_URL && !ok.querySelector('.book__demo')) ok.querySelector('.book__lead')!.insertAdjacentHTML('afterend', '<p class="book__demo">Это демо: бот для заявок ещё не подключён, заявка никуда не ушла</p>')
    } catch {
      err.innerHTML = `Не получилось отправить. Позвоните, пожалуйста: <a href="tel:${SITE.phone.tel}">${SITE.phone.label}</a>`
      err.hidden = false
    } finally { send.disabled = false }
  })

  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-book]')
    if (!b) return
    e.preventDefault(); open(b)
  })
}

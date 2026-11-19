// Шапка: на первом экране прозрачная, дальше — плотная полоса (на телефоне прячется при прокрутке вниз).
// Статус «Открыто до 23:00» по саратовскому времени (центр на Шевченко), у карточек центров — по их часам. Меню на телефоне
import { SITE } from '../site.config'
import { saratovHour, still } from './env'

function liveStatus() {
  const h = saratovHour()
  const open = still || (h >= SITE.hours.open && h < SITE.hours.close)
  document.querySelectorAll<HTMLElement>('[data-live]').forEach((el) => {
    el.classList.toggle('off', !open)
    const t = el.querySelector('[data-live-t]')
    if (t) t.textContent = open ? `Открыто до ${SITE.hours.close}:00` : `Откроемся в ${SITE.hours.open}:00`
  })
  document.querySelectorAll<HTMLElement>('[data-live-dot]').forEach((d) => {
    const o = Number(d.dataset.open), c = Number(d.dataset.close)
    d.classList.toggle('off', !still && !(h >= o && h < c))
  })
}

export function initNav() {
  liveStatus(); setInterval(liveStatus, 60_000)
  const nav = document.getElementById('nav')!
  const hero = document.getElementById('top')!
  const mob = matchMedia('(max-width: 760px)')
  let lastY = scrollY, ticking = false
  const onScroll = () => {
    ticking = false
    const y = scrollY, fixed = y > hero.offsetHeight - 80
    nav.classList.toggle('nav--fixed', fixed)
    if (fixed && mob.matches && Math.abs(y - lastY) > 6) nav.classList.toggle('nav--hide', y > lastY && !document.documentElement.classList.contains('menu-open'))
    if (!fixed || !mob.matches) nav.classList.remove('nav--hide')
    if (Math.abs(y - lastY) > 6) lastY = y
    document.querySelector('[data-dock]')?.classList.toggle('show', !still && y > hero.offsetHeight * 0.6)
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true })
  onScroll()

  const btn = document.querySelector<HTMLButtonElement>('[data-menu]')!
  const menu = document.getElementById('menu')!
  const html = document.documentElement
  const set = (on: boolean) => {
    menu.hidden = !on; html.classList.toggle('menu-open', on); html.classList.toggle('is-locked', on)
    btn.setAttribute('aria-expanded', String(on))
    if (on) { nav.classList.remove('nav--hide'); menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true }) }
  }
  btn.addEventListener('click', () => set(menu.hidden))
  menu.querySelectorAll('[data-close]').forEach((a) => a.addEventListener('click', () => set(false)))
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus() } })
  matchMedia('(min-width: 761px)').addEventListener('change', (e) => { if (e.matches) set(false) })
}

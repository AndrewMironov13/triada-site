// Первый экран «Студия»: вкладка меняет слово за машиной, кадр, строку, цену и плашку-уведомление.
// Ручки для снимков: ?static (без анимаций), ?tab=start|signal|audio|light|radio|noise, ?lvl=1|2|3
import { TABS, TAB_ORDER, LEVELS, firstTab, type Tab } from '../site.config'
import { media, reduceMotion, mqMobile, goal, still, q } from './env'

export const ICONS: Record<string, string> = {
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  speaker: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  light: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  screen: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  quiet: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  both: '<path d="M1.6 17.6a1.4 1.4 0 0 0-.4 1V20a.7.7 0 0 0 .7.7h2a.7.7 0 0 0 .7-.7v-.7h1.4v-1.4h1l.5-.5a4.5 4.5 0 1 0-2.8-2.8z"/><rect width="8" height="14" x="14" y="5" rx="1.6"/><path d="M18 16h.01"/>',
  gps: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  off: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
}
export const icon = (k: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] ?? ''}</svg>`

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)
let cur: Tab = 'start'
export const currentTab = () => cur
export let currentLevel = 2

const img = (k: Tab) => ({
  dbg: media(`hero/${k}-d-bg.jpg`), dcar: media(`hero/${k}-d-car.webp`),
  mbg: media(`hero/${k}-m-bg.jpg`), mcar: media(`hero/${k}-m-car.webp`),
})

export function initHero() {
  const hero = $('#top')!
  const word = $('#heroWord')!
  const tabsEl = $('#tabs')!
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize)

  // слово во всю ширину, но короткие («Автозвук») не раздуваем
  function fitWord() {
    const target = hero.clientWidth - (mqMobile.matches ? 3.2 : 9.6) * rem()
    const maxFs = (mqMobile.matches ? 8.2 : 30) * rem()
    word.style.fontSize = '100px'
    const r = document.createRange(); r.selectNodeContents(word)
    word.style.fontSize = Math.min(maxFs, (100 * target) / r.getBoundingClientRect().width) + 'px'
  }
  function place(k: Tab) {
    const p = mqMobile.matches ? TABS[k].m : TABS[k].d
    hero.style.setProperty('--sx', p.spot[0] / 10 + 'rem'); hero.style.setProperty('--sy', p.spot[1] / 10 + 'rem')
    hero.style.setProperty('--tx', p.tag[0] / 10 + 'rem'); hero.style.setProperty('--ty', p.tag[1] / 10 + 'rem')
  }
  function lead() {
    const L = $('#leadLine'), spot = $('#spot'), tag = $('#tag'), svg = $('.lead')
    if (!L || !spot || !tag || !svg) return
    const sc = svg.getBoundingClientRect(), s = spot.getBoundingClientRect(), g = tag.getBoundingClientRect()
    const x1 = s.left + s.width / 2 - sc.left, y1 = s.top + s.height / 2 - sc.top
    const gx = g.left - sc.left, gy = g.top - sc.top, gw = g.width, gh = g.height
    const x2 = x1 < gx ? gx : x1 > gx + gw ? gx + gw : x1
    const y2 = x1 < gx || x1 > gx + gw ? gy + gh / 2 : y1 < gy ? gy : gy + gh
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, r = s.width / 2 + 3
    L.setAttribute('x1', String(x1 + (dx / d) * r)); L.setAttribute('y1', String(y1 + (dy / d) * r))
    L.setAttribute('x2', String(x2)); L.setAttribute('y2', String(y2))
  }
  const follow = (ms = 700) => { const t0 = performance.now(); const f = () => { lead(); if (performance.now() - t0 < ms) requestAnimationFrame(f) }; f() }

  function swapImages(k: Tab, animated: boolean) {
    const im = img(k)
    const pb = $('.scene > picture'), pc = $('.scene__car picture')
    const swap = () => {
      if (pb) { $('source', pb)!.setAttribute('srcset', im.mbg); $<HTMLImageElement>('img', pb)!.src = im.dbg }
      if (pc) { $('source', pc)!.setAttribute('srcset', im.mcar); const ci = $<HTMLImageElement>('img', pc)!; ci.src = im.dcar; ci.alt = TABS[k].alt }
    }
    if (!animated) return swap()
    const els = [$('.scene__bg'), $('.scene__car')].filter(Boolean) as HTMLElement[]
    els.forEach((e) => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }))
    setTimeout(() => { swap(); els.forEach((e) => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'forwards' })) }, 220)
  }

  function setTab(k: Tab, first = false) {
    const t = TABS[k]; if (!t) return
    const animated = !first && !still && !reduceMotion
    cur = k; hero.dataset.tab = k
    $('#heroLine')!.textContent = t.line
    $('#heroSub')!.textContent = t.sub
    $('#ctaPrice')!.innerHTML = t.price
    $('#tagA')!.textContent = t.app; $('#tagT')!.textContent = t.time
    $('#tagB')!.textContent = t.tagB; $('#tagS')!.textContent = t.tagS
    $('#tagI')!.innerHTML = icon(t.icon)
    const cta = $('#ctaBtn')!; (cta.firstChild as Text).textContent = t.cta + ' '
    place(k)
    swapImages(k, animated)
    const sp = $('span', word)!
    if (!animated) { sp.textContent = t.word; fitWord() }
    else {
      sp.getAnimations().forEach((a) => a.cancel())
      sp.animate([{ transform: 'none' }, { transform: 'translateY(110%)' }], { duration: 280, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })
      setTimeout(() => {
        sp.getAnimations().forEach((a) => a.cancel()); sp.textContent = t.word; fitWord()
        sp.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      }, 280)
      ;['#heroLine', '#heroSub', '#tag'].forEach((s) => $(s)?.animate([{ opacity: 0, transform: 'translateY(.6rem)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' }))
    }
    tabsEl.querySelectorAll<HTMLButtonElement>('[data-k]').forEach((b) => {
      const on = b.dataset.k === k
      b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1
    })
    if (!first) goal('tab_' + k)
    follow()
  }

  tabsEl.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-k]')
    if (!b) return
    setTab(b.dataset.k as Tab)
    if (mqMobile.matches) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  })
  // стрелки по вкладкам
  tabsEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = TAB_ORDER.indexOf(cur), n = TAB_ORDER[(i + (e.key === 'ArrowRight' ? 1 : TAB_ORDER.length - 1)) % TAB_ORDER.length]
    setTab(n); tabsEl.querySelector<HTMLButtonElement>(`[data-k="${n}"]`)?.focus()
  })

  // автозвук: «Насколько громко?»
  const lvl = $('#lvl')!
  function setLvl(n: number, first = false) {
    const L = LEVELS[n - 1]; if (!L) return
    currentLevel = n
    lvl.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((b) => { const on = Number(b.dataset.l) === n; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)) })
    $('#lvlWhat')!.textContent = L.what; $('#lvlPrice')!.innerHTML = L.price
    if (!first && !still && !reduceMotion) $('.lvl__out')!.animate([{ opacity: 0, transform: 'translateY(.4rem)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' })
  }
  lvl.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLButtonElement>('[data-l]'); if (b) setLvl(Number(b.dataset.l)) })

  // старт: вкладка из адреса или по сезону
  const want = q.get('tab') as Tab | null
  setTab(want && TABS[want] ? want : firstTab(), true)
  setLvl(Number(q.get('lvl') || 2), true)
  if (still) hero.classList.remove('intro')
  // предзагрузка кадров остальных вкладок, когда страница успокоится
  setTimeout(() => TAB_ORDER.forEach((k) => { if (k === cur) return; const i = img(k); [mqMobile.matches ? i.mbg : i.dbg, mqMobile.matches ? i.mcar : i.dcar].forEach((s) => { const x = new Image(); x.src = s }) }), 2500)
  document.fonts?.ready.then(() => { fitWord(); lead() })
  addEventListener('resize', () => { fitWord(); place(cur); lead() })
  setTimeout(lead, 60); setTimeout(lead, 2300)
}

// Общие флаги: адреса медиа, «меньше движения», телефонная вёрстка, цели Метрики, ручки для снимков
export const BASE = import.meta.env.BASE_URL
export const media = (p: string) => `${BASE}media/${p}`
export const reduceMotion = document.documentElement.classList.contains('rm')
export const mqMobile = matchMedia('(max-width: 760px)')
export const q = new URLSearchParams(location.search)
export const still = q.has('static')
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function goal(name: string) {
  const w = window as Window & { ym?: (...a: unknown[]) => void; __ym?: number }
  if (w.ym && w.__ym) w.ym(w.__ym, 'reachGoal', name)
}

export function saratovHour() {
  const p = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Saratov', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date())
  const h = Number(p.find((x) => x.type === 'hour')?.value ?? 12)
  const m = Number(p.find((x) => x.type === 'minute')?.value ?? 0)
  return h + m / 60
}

// Подбор сигнализации: как управлять, GPS, машина и год → модель и цена «от» с установкой
import { KIT } from '../site.config'
import { fmt, still, q, goal } from './env'
import { icon } from './hero'

export type CalcState = { model: string; price: number; what: string; car: string; year: string }
let state: CalcState | null = null
export const calcState = () => state

export function initCalc() {
  const form = document.getElementById('calcForm') as HTMLFormElement | null
  if (!form) return
  form.querySelectorAll<HTMLElement>('[data-i]').forEach((e) => e.insertAdjacentHTML('afterbegin', icon(e.dataset.i!)))
  const $ = <T extends Element = HTMLElement>(s: string) => form.querySelector<T>(s)!
  const sum = $('#sum'), car = $<HTMLInputElement>('#calcCar')
  let shown: number | null = null
  let touched = false

  function recalc() {
    let ctl = $<HTMLInputElement>('input[name=ctl]:checked').value
    const gps = $<HTMLInputElement>('input[name=gps]:checked').value === '1'
    // GPS смотрят в приложении, поэтому «брелок + GPS» — тот же комплект, что «брелок и телефон + GPS».
    // Выбор человека не трогаем: раньше кнопка сама перескакивала на «Брелок и телефон», 20.11 Константин: «работает некорректно»
    if (ctl === 'fob' && gps) ctl = 'both'
    const k = (KIT as Record<string, { m: string; e: string; p: number; what: string }>)[ctl + (gps ? '+gps' : '')] ?? KIT[ctl as keyof typeof KIT]
    $('#kitModel').innerHTML = `${k.m} <span>${k.e}</span>`
    if (shown !== null && shown !== k.p && !still) sum.animate([{ opacity: 0.3, transform: 'translateY(.6rem)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' })
    sum.textContent = fmt(k.p); shown = k.p
    const c = car.value.trim(), y = form!.querySelector<HTMLInputElement>('input[name=yr]:checked')?.value ?? ''
    $('#kitList').textContent = [k.what, c && (c + (y ? ', ' + y : ''))].filter(Boolean).join(' · ')
    state = { model: `${k.m} ${k.e}`, price: k.p, what: k.what, car: c, year: y }
  }
  form.addEventListener('change', () => { recalc(); if (!touched) { touched = true; goal('calc_use') } })
  form.addEventListener('input', recalc)
  if (q.get('ctl')) form.querySelector<HTMLInputElement>(`input[name=ctl][value=${q.get('ctl')}]`)!.checked = true
  if (q.get('gps')) form.querySelector<HTMLInputElement>(`input[name=gps][value="${q.get('gps')}"]`)!.checked = true
  if (q.has('car')) car.value = q.get('car')!
  if (q.has('yr')) form.querySelectorAll<HTMLInputElement>('input[name=yr]')[Number(q.get('yr'))]!.checked = true
  recalc()
}

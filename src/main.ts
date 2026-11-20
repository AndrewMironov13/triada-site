import './fonts.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/sections.css'
import { initHero } from './modules/hero'
import { initNav } from './modules/nav'
import { initCalc } from './modules/calc'
import { initBooking } from './modules/booking'
import { initWorks } from './modules/works'
import { inView } from 'motion'
import { goal, still } from './modules/env'

document.documentElement.classList.add('js')
if (still) {
  document.documentElement.classList.add('still')
  // на снимках страница снимается целиком без прокрутки — отложенные картинки грузим сразу
  document.querySelectorAll<HTMLImageElement>('img[loading=lazy]').forEach((i) => { i.loading = 'eager' })
}
initHero()
initNav()
initCalc()
initBooking()
initWorks()

// блоки появляются при прокрутке; на снимках (?static) и при «меньше движения» — сразу
const rv = document.querySelectorAll<HTMLElement>('.rv')
if (still || document.documentElement.classList.contains('rm') || !('IntersectionObserver' in window)) rv.forEach((e) => e.classList.add('in'))
else {
  rv.forEach((e) => inView(e, () => { e.classList.add('in') }, { margin: '0px 0px -10% 0px' }))
}

// цели Метрики по data-goal
document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-goal]')
  if (el) goal(el.dataset.goal!)
})

import { defineConfig, loadEnv, type Plugin } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SITE, SEO, TABS, TAB_ORDER, SERVICES, MINIMUM, WORKS, STEPS, REVIEWS, FAQ, LEVELS, START_CAR } from './src/site.config'

// Переменные сборки:
//   VITE_SITE_URL — адрес сайта со слэшем на конце (canonical, og, sitemap)
//   VITE_BASE     — подпапка на хостинге ('/' на домене)
//   VITE_NOINDEX  — '1' для демо: noindex + Disallow
//   VITE_METRIKA  — номер счётчика Яндекс Метрики (только в боевой сборке)
//   VITE_YANDEX_VERIFY, VITE_GOOGLE_VERIFY — коды подтверждения прав
//   VITE_LEAD_URL — адрес, куда форма записи отправляет заявку (бот MAX / Telegram)
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'
  const site = (env.VITE_SITE_URL || 'https://triada.example/').replace(/\/?$/, '/')
  const noindex = env.VITE_NOINDEX === '1' || command === 'serve'
  if (command === 'build' && !noindex && !env.VITE_SITE_URL) throw new Error('Нужен VITE_SITE_URL (или VITE_NOINDEX=1 для демо)')
  const m = (p: string) => `${base}media/${p}`
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${site}#org`, name: SITE.full, alternateName: ['ТРИАДА', 'Триада'],
        url: site, logo: `${site}apple-touch-icon.png`, sameAs: [SITE.vk, SITE.tg, ...SITE.centers.map((c) => c.maps)],
        department: SITE.centers.map((c) => ({
          '@type': ['AutoRepair', 'LocalBusiness'], name: `ТРИАДА, ${c.street}`, telephone: c.phone.tel, image: `${site}og.jpg`,
          address: { '@type': 'PostalAddress', streetAddress: c.street, addressLocality: SITE.city, addressRegion: 'Саратовская область', addressCountry: 'RU' },
          geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lon }, hasMap: c.maps,
          openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: `${c.open}:00`, closes: `${c.close}:00` }],
          priceRange: 'от 1 500 ₽',
        })),
      },
      { '@type': 'WebSite', '@id': `${site}#site`, url: site, name: 'ТРИАДА', inLanguage: 'ru-RU', publisher: { '@id': `${site}#org` } },
    ],
  }

  // вкладки первого экрана
  const tabs = TAB_ORDER.map((k) => `<button type="button" role="tab" data-k="${k}" aria-selected="false"><i class="dot"></i>${TABS[k].label}</button>`).join('')
  const levels = LEVELS.map((L, i) => `<button type="button" role="radio" data-l="${i + 1}" aria-checked="false"><svg class="vol" viewBox="0 0 28 24" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>${['M15.5 9.5a3.6 3.6 0 0 1 0 5', 'M18.6 6.4a8 8 0 0 1 0 11.2', 'M21.7 3.3a12.4 12.4 0 0 1 0 17.4'].map((d, k) => `<path d="${d}"${k <= i ? '' : ' class="dim"'}/>`).join('')}</svg><b>${L.label}</b></button>`).join('')
  // услуги списком
  const services = SERVICES.map((s, i) => `<li class="svc rv" style="--d:${(i * 0.04).toFixed(2)}s">
        <span class="svc__n">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="svc__name">${s.name}</h3>
        <p class="svc__text">${s.text}</p>
        <p class="svc__price">${s.price}</p>
        <button class="svc__go" type="button" data-book data-svc="${s.key}" aria-label="Записаться: ${s.name}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
      </li>`).join('\n      ')
  // «Базовый минимум»: две карточки, кнопка открывает запись с отмеченными услугами
  const minimum = MINIMUM.map((c, i) => `<article class="mcard rv" style="--d:${(i * 0.08).toFixed(2)}s">
          <p class="mcard__for"><span>Если машина</span>${c.title}</p>
          <p class="mcard__cars">${c.cars}</p>
          <ul class="mcard__list">${c.items.map(([n, p]) => `<li><b>${n}</b><em>${p}</em></li>`).join('')}</ul>
          <button class="btn btn--r mcard__go" type="button" data-book data-svc="${c.svc}" data-kit="${esc(c.kit)}" data-goal="minimum_${c.key}">Записаться на комплекс <span class="arr"><svg><use href="#i-arr"/></svg></span></button>
        </article>`).join('\n        ')
  const works = WORKS.map((work, index) => `<button class="work" type="button" data-work="work-${index}" aria-haspopup="dialog" aria-controls="workDialog">
          <img${work.fit === 'contain' ? ' class="work__cover--contain"' : ''} src="${m('works/' + work.cover + '.jpg')}" alt="" loading="lazy" decoding="async" width="800" height="500">
          <span class="work__caption"><b>${esc(work.car)}</b><span>${esc(work.what)}</span></span>
          <svg class="work__arrow" aria-hidden="true"><use href="#i-arr"/></svg>
        </button>
        <template id="work-${index}">
          <h3 id="workTitle">${esc(work.car)}</h3>
          <p class="work-dialog__summary">${esc(work.what)}</p>
          <div class="work-dialog__photos">${work.photos.map((photo) => `<figure>
            <img src="${m('works/' + photo.file + '.jpg')}" alt="" decoding="async">
            <figcaption>${esc(photo.caption)}</figcaption>
          </figure>`).join('')}</div>
        </template>`).join('\n        ')
  const steps = STEPS.map((s, i) => `<li class="step rv" style="--d:${(i * 0.06).toFixed(2)}s"><span class="step__n">${String(i + 1).padStart(2, '0')}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('\n        ')
  const reviews = REVIEWS.map((r) => `<figure class="rev"><blockquote>«${r.t}»</blockquote><figcaption><b>${r.a}</b><span>${r.d}, Яндекс Карты</span></figcaption></figure>`).join('\n        ')
  const faq = FAQ.map((f, i) => `<details class="qa rv" style="--d:${(i * 0.04).toFixed(2)}s"><summary><span>${f.q}</span><i aria-hidden="true"></i></summary><p>${f.a}</p></details>`).join('\n        ')
  const centers = SITE.centers.map((c) => `<div class="center rv">
          <p class="center__name">${c.name}<span>${c.district}</span></p>
          <p class="center__street">${c.street}</p>
          <p class="center__hours"><i data-live-dot data-open="${c.open}" data-close="${c.close}"></i>${c.hours}</p>
          <div class="center__acts"><a class="btn btn--r" href="tel:${c.phone.tel}" data-goal="phone">${c.phone.label}</a><a class="btn btn--o" href="${c.maps}" target="_blank" rel="noopener" data-goal="route">Маршрут</a></div>
        </div>`).join('\n        ')

  const html: Plugin = {
    name: 'triada-html',
    // order: 'pre' — подставляем до разбора HTML сборщиком (иначе %MAX_HIDDEN% ломает парсер)
    transformIndexHtml: { order: 'pre', handler(src) {
      const map: Record<string, string> = {
        SEO_TITLE: SEO.title, SEO_DESCRIPTION: SEO.description, SEO_H1: SEO.h1, SITE_URL: site, BASE: base,
        ROBOTS: noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="max-image-preview:large, max-snippet:-1">',
        VERIFY: [env.VITE_YANDEX_VERIFY && `<meta name="yandex-verification" content="${env.VITE_YANDEX_VERIFY}">`, env.VITE_GOOGLE_VERIFY && `<meta name="google-site-verification" content="${env.VITE_GOOGLE_VERIFY}">`].filter(Boolean).join('\n'),
        JSON_LD: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        TEL: SITE.phone.tel, TEL_LABEL: SITE.phone.label, TG_URL: SITE.tg, VK_URL: SITE.vk, IG_URL: SITE.instagram, MAX_URL: SITE.max || '#',
        MAX_HIDDEN: SITE.max ? '' : ' hidden', LEGAL: SITE.legal, REVIEWS_URL: SITE.reviewsUrl,
        RATING: SITE.rating.value, RATING_NOTE: SITE.rating.note,
        TABS: tabs, LEVELS: levels, SERVICES: services, MINIMUM: minimum, WORKS: works, STEPS: steps, REVIEWS: reviews, FAQ: faq, CENTERS: centers,
        M: `${base}media/`, START_CAR: m(START_CAR), START_ALT: esc(TABS.start.alt),
      }
      let out = src.replace(/%([A-Z0-9_]+)%/g, (s, k) => (k in map ? map[k] : s))
      if (env.VITE_METRIKA && command === 'build') {
        const id = env.VITE_METRIKA
        out = out.replace('</head>', `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");if(!/^(localhost|127\\.)/.test(location.hostname))ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});window.__ym=${id};</script>\n</head>`)
      }
      return out
    } },
    closeBundle() {
      if (command !== 'build') return
      const out = resolve(process.cwd(), 'dist')
      writeFileSync(resolve(out, 'robots.txt'), noindex ? 'User-agent: *\nDisallow: /\n'
        : `User-agent: *\nAllow: /\nClean-param: tab&utm_source&utm_medium&utm_campaign&utm_content&utm_term /\n\nSitemap: ${site}sitemap.xml\n`)
      writeFileSync(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`)
    },
  }

  return {
    base,
    plugins: [html],
    build: { target: 'es2020', assetsInlineLimit: 0, cssCodeSplit: false },
    server: { port: 5292, strictPort: true, host: '127.0.0.1' },
    preview: { port: 5293, strictPort: true, host: '127.0.0.1' },
  }
})

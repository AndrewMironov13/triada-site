# ТРИАДА — сайт установочного центра (Саратов)

Эскиз «Студия» одобрен Константином Ефименко 19.11.2026. Каркас — как у СарБокса (`~/Claude/sarbox-site`).
Материалы, эскизы и расшифровки голосовых — `~/Claude/traffic/sketches/triada/`.

## Команды

- `npm run dev` — порт 5292 (конфиг `triada-site` в `~/Claude/.claude/launch.json`)
- `VITE_SITE_URL=https://домен/ npm run build` — боевая сборка в `dist/`
- `VITE_NOINDEX=1` — демо: noindex и Disallow; `VITE_BASE=/triada-site/` — сайт в подпапке
- `VITE_DEMO=1` — форма без бота показывает «Заявка у нас» с пометкой «это демо»
- `VITE_LEAD_URL` — куда форма шлёт заявку POST-запросом (JSON: services, kit, car, year, phone, name, page, tab)
- `VITE_METRIKA`, `VITE_YANDEX_VERIFY`, `VITE_GOOGLE_VERIFY` — Метрика и подтверждение прав

Демо: `sh scripts/deploy-demo.sh` — сборка в ветку `gh-pages` → https://andrewmironov13.github.io/triada-site/
(Actions не используем: у токена gh нет права `workflow`)

## Где что

- `src/site.config.ts` — все тексты, цены, вкладки первого экрана, «Базовый минимум», работы, отзывы, вопросы, адреса
- `vite.config.ts` — плагин `triada-html`: подставляет `%ПОЛЯ%` из конфига в `index.html`, JSON-LD, robots и sitemap
- `src/modules/` — `hero.ts` (вкладки и плашки), `calc.ts` (подбор сигнализации), `booking.ts` (окно записи), `nav.ts`
- `public/media/` — кадры сцен первого экрана (фон + вырезанная машина), фото работ с размытыми номерами

## Цены (откуда)

- Автозапуск 18 000, S96 v2 30 000 — их посты; E97 GSM 35 000 и E97 GSM GPS 40 000 — условные, спросить
- 19.11 Константин: тонировка — как на сайте детейлинга (взяли Интеллект: 5 000 за машину → «от 5 000»);
  автозвук, регистраторы и прочее — как у СарБокса (автозвук от 3 000, магнитола с камерой от 2 500, регистратор от 1 500, шумоизоляция от 10 000);
  электропривод багажника: установка 10 000 на любую машину, привод под заказ 7 дней от 18 000 до 45 000
- «Базовый минимум»: иномарке (20.11 Андрей: было «китайской») тонировка, сигнализация, привод багажника; отечественной автозвук, Android-магнитола, камера. Общую цену комплекса не называли

## Заявки: `lead-function/` → группа в Telegram

Функция Yandex Cloud (nodejs22, без зависимостей, логи выключены): принимает POST с сайта (text/plain с JSON — без preflight),
проверяет Origin, телефон, поле-ловушку `company`, не больше 5 заявок с адреса за 10 минут, шлёт в группу через Bot API.
- `node lead-function/test.mjs` — проверка без бота; `node lead-function/e2e.mjs <сборка>` — браузер → функция → поддельный Telegram
- `sh lead-function/tg-check.sh` — id групп, куда добавлен бот; `sh lead-function/tg-check.sh <id>` — пробное сообщение
- `sh lead-function/deploy.sh` — выкладка (нужны `yc init`, TRIADA_TG_TOKEN и TRIADA_TG_CHAT_ID в ~/.zshrc), адрес → `lead-function/URL`
- после неё `sh scripts/deploy-demo.sh` — демо шлёт заявки в группу. Свой домен — в TRIADA_ORIGINS
- Цена: бесплатно до 1 млн вызовов и 10 ГБ×ч в месяц (обновляется каждый месяц), дальше 18,97 ₽ за млн вызовов и 6,48 ₽ за ГБ×ч
- Выложено 20.11.2026 в Yandex Cloud Андрея (облако cloud-nimbus-870, каталог default, функция `triada-lead`, nodejs22, 128 МБ, логи выключены)
- Из Yandex Cloud api.telegram.org не открывается (РФ режет Telegram) — функция шлёт через посредника `tg-relay/` на Cloudflare
  (https://triada-tg.mirweb-crm.workers.dev, аккаунт Андрея, где CRM; пропускает только sendMessage бота @triada_leads_bot, ключ не хранит).
  Выкладка посредника: `cd tg-relay && ~/crm/node_modules/.bin/wrangler deploy`. Лимит D1 не трогает, делит с CRM 100 000 запросов в сутки
- Группа «Заявки ТРИАДА», id в `lead-function/.chat-id` (не в git). Деплой функции: `zsh -c 'source ~/.zshrc; sh lead-function/deploy.sh'`
- К запуску: перенести функцию в облако Константина (он добавляет Андрея по Яндекс ID), добавить домен в TRIADA_ORIGINS
- MAX потом: вторая отправка рядом с `sendTelegram`, из Yandex Cloud MAX открывается напрямую

## Не решено

 ссылка на личку Константина в MAX (`SITE.max`), домен и хостинг, кадр для вкладки «Тонировка» на первом экране

#!/bin/sh
# Выкладка функции приёма заявок в Yandex Cloud: sh lead-function/deploy.sh
# Один раз до этого: аккаунт Yandex Cloud с картой, `yc init` (вход и каталог),
# в ~/.zshrc — TRIADA_TG_TOKEN (ключ бота); id группы — TRIADA_TG_CHAT_ID или файл .chat-id (несколько через «;»).
# Свой домен сайта добавить в TRIADA_ORIGINS через «;» — иначе функция не примет заявки с него.
set -e
cd "$(dirname "$0")"
# ключ бота должен быть в окружении: запускать так — zsh -c 'source ~/.zshrc >/dev/null 2>&1; sh lead-function/deploy.sh'
export PATH="$HOME/yandex-cloud/bin:$PATH"
[ -n "$TRIADA_TG_TOKEN" ] || { echo "Нет TRIADA_TG_TOKEN в ~/.zshrc"; exit 1; }
# id группы: из ~/.zshrc или из lead-function/.chat-id (его пишет wait-group.sh, в git не попадает)
[ -n "$TRIADA_TG_CHAT_ID" ] || TRIADA_TG_CHAT_ID=$(cat .chat-id 2>/dev/null || true)
[ -n "$TRIADA_TG_CHAT_ID" ] || { echo "Нет id группы: sh lead-function/wait-group.sh"; exit 1; }
NAME=triada-lead
ORIGINS="https://andrewmironov13.github.io;http://127.0.0.1:5292;http://localhost:5292${TRIADA_ORIGINS:+;$TRIADA_ORIGINS}"
# Telegram из Yandex Cloud недоступен — через посредника tg-relay на Cloudflare
TG_API="${TRIADA_TG_API:-https://triada-tg.mirweb-crm.workers.dev}"
node test.mjs >/dev/null || { echo "Локальная проверка не прошла: node lead-function/test.mjs"; exit 1; }
yc serverless function get "$NAME" >/dev/null 2>&1 || yc serverless function create --name "$NAME" --description "Заявки с сайта ТРИАДЫ в Telegram" >/dev/null
# логи выключены: Cloud Logging с 22.10.2026 закрыт для новых клиентов и тарифицируется
yc serverless function version create --function-name "$NAME" --runtime nodejs22 --entrypoint index.handler \
  --memory 128m --execution-timeout 10s --source-path ./src --no-logging \
  --environment "TG_TOKEN=$TRIADA_TG_TOKEN,TG_CHAT_ID=$TRIADA_TG_CHAT_ID,ALLOWED_ORIGINS=$ORIGINS,TG_API=$TG_API" >/dev/null
yc serverless function allow-unauthenticated-invoke "$NAME" >/dev/null
yc serverless function get "$NAME" --format json | python3 -c 'import sys,json; print(json.load(sys.stdin)["http_invoke_url"])' > URL
echo "Функция работает: $(cat URL)"
echo "Дальше: sh scripts/deploy-demo.sh — демо начнёт слать заявки в группу"

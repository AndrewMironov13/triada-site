#!/bin/sh
# Выкладка функции приёма заявок в Yandex Cloud: sh lead-function/deploy.sh
# Один раз до этого: аккаунт Yandex Cloud с картой, `yc init` (вход и каталог),
# в ~/.zshrc — TRIADA_TG_TOKEN (ключ бота) и TRIADA_TG_CHAT_ID (id группы, несколько через «;»).
# Свой домен сайта добавить в TRIADA_ORIGINS через «;» — иначе функция не примет заявки с него.
set -e
cd "$(dirname "$0")"
. ~/.zshrc >/dev/null 2>&1 || true
export PATH="$HOME/yandex-cloud/bin:$PATH"
[ -n "$TRIADA_TG_TOKEN" ] || { echo "Нет TRIADA_TG_TOKEN в ~/.zshrc"; exit 1; }
[ -n "$TRIADA_TG_CHAT_ID" ] || { echo "Нет TRIADA_TG_CHAT_ID в ~/.zshrc"; exit 1; }
NAME=triada-lead
ORIGINS="https://andrewmironov13.github.io;http://127.0.0.1:5292;http://localhost:5292${TRIADA_ORIGINS:+;$TRIADA_ORIGINS}"
node test.mjs >/dev/null || { echo "Локальная проверка не прошла: node lead-function/test.mjs"; exit 1; }
yc serverless function get "$NAME" >/dev/null 2>&1 || yc serverless function create --name "$NAME" --description "Заявки с сайта ТРИАДЫ в Telegram" >/dev/null
# логи выключены: Cloud Logging с 22.10.2026 закрыт для новых клиентов и тарифицируется
yc serverless function version create --function-name "$NAME" --runtime nodejs22 --entrypoint index.handler \
  --memory 128m --execution-timeout 10s --source-path ./src --no-logging \
  --environment "TG_TOKEN=$TRIADA_TG_TOKEN,TG_CHAT_ID=$TRIADA_TG_CHAT_ID,ALLOWED_ORIGINS=$ORIGINS" >/dev/null
yc serverless function allow-unauthenticated-invoke "$NAME" >/dev/null
yc serverless function get "$NAME" --format json | python3 -c 'import sys,json; print(json.load(sys.stdin)["http_invoke_url"])' > URL
echo "Функция работает: $(cat URL)"
echo "Дальше: sh scripts/deploy-demo.sh — демо начнёт слать заявки в группу"

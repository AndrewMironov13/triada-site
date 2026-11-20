#!/bin/sh
# Проверка бота: показывает группы, куда его добавили, и шлёт пробное сообщение.
#   sh lead-function/tg-check.sh             — список групп с их id
#   sh lead-function/tg-check.sh -100123...  — пробное сообщение в эту группу
# Ключ бота берётся из TRIADA_TG_TOKEN (~/.zshrc) и на экран не выводится
. ~/.zshrc >/dev/null 2>&1 || true
[ -n "$TRIADA_TG_TOKEN" ] || { echo "Нет TRIADA_TG_TOKEN в ~/.zshrc"; exit 1; }
API="https://api.telegram.org/bot$TRIADA_TG_TOKEN"
if [ -z "$1" ]; then
  curl -s "$API/getUpdates?allowed_updates=%5B%22message%22%2C%22my_chat_member%22%5D" | python3 -c '
import sys, json
d = json.load(sys.stdin)
if not d.get("ok"): sys.exit("Telegram ответил ошибкой: %s" % d.get("description"))
chats = {}
for u in d["result"]:
    for k in ("message", "my_chat_member"):
        c = (u.get(k) or {}).get("chat")
        if c and c.get("type") in ("group", "supergroup"): chats[c["id"]] = c.get("title")
if not chats: print("Групп не видно. Добавь бота в группу и напиши там любое сообщение, потом запусти ещё раз")
for i, t in chats.items(): print(i, t)
'
else
  curl -s -X POST "$API/sendMessage" -H 'Content-Type: application/json' \
    -d "{\"chat_id\": \"$1\", \"text\": \"Бот подключён: сюда будут приходить заявки с сайта ТРИАДЫ\"}" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print("Отправлено" if d.get("ok") else "Ошибка: %s" % d.get("description"))'
fi

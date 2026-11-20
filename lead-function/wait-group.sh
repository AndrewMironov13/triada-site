#!/bin/sh
# Ждёт до 15 минут, пока бота добавят в группу; id группы пишет в lead-function/.chat-id (не в git).
# Ключ берётся из TRIADA_TG_TOKEN и не выводится
cd "$(dirname "$0")"
[ -n "$TRIADA_TG_TOKEN" ] || { echo "нет TRIADA_TG_TOKEN"; exit 1; }
API="https://api.telegram.org/bot$TRIADA_TG_TOKEN"
i=0
while [ $i -lt 90 ]; do
  found=$(curl -s "$API/getUpdates" | python3 -c '
import sys, json
try: d = json.load(sys.stdin)
except Exception: sys.exit()
chats = {}
for u in d.get("result", []):
    for k, v in u.items():
        if not isinstance(v, dict): continue
        c = v.get("chat") or {}
        if c.get("type") in ("group", "supergroup"):
            chats[c["id"]] = c.get("title")
        if v.get("migrate_to_chat_id"): chats[v["migrate_to_chat_id"]] = c.get("title")
for cid, t in chats.items(): print("%s\t%s" % (cid, t))
')
  if [ -n "$found" ]; then
    echo "$found"
    echo "$found" | tail -1 | cut -f1 > .chat-id
    exit 0
  fi
  i=$((i+1)); sleep 10
done
echo "За 15 минут бота в группу не добавили"; exit 1

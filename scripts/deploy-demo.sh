#!/bin/sh
# Демо на GitHub Pages: собирает сайт в подпапку /triada-site/ и кладёт сборку в ветку gh-pages.
# Запуск из корня проекта: sh scripts/deploy-demo.sh
set -e
cd "$(dirname "$0")/.."
VITE_BASE=/triada-site/ VITE_SITE_URL=https://andrewmironov13.github.io/triada-site/ VITE_NOINDEX=1 VITE_DEMO=1 npm run build
TMP=$(mktemp -d)
cp -R dist/. "$TMP"/
touch "$TMP/.nojekyll"
REMOTE=$(git remote get-url origin)
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="Andrew Mironov" -c user.email="AndrewMironov13@users.noreply.github.com" commit -q -m "Демо $(date '+%d.%m.%Y %H:%M')"
for i in 1 2 3 4; do git -c http.postBuffer=157286400 push -q -f "$REMOTE" gh-pages && break; echo "повтор $i"; sleep 5; done
cd - >/dev/null
rm -rf "$TMP"
echo "Готово: https://andrewmironov13.github.io/triada-site/ (обновится через 1–2 минуты)"

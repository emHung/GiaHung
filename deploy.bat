@echo off
call npm run build
cd dist
git init
git add -A
git commit -m "deploy"
git push -f https://github.com/emHung/GiaHung.git master:gh-pages
cd ..
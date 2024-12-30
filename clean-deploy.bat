@echo off
echo Cleaning up...
rmdir /s /q dist
echo Building project...
npm run build
echo Deploying...
cd dist
git init
git add .
git commit -m "deploy"
git remote remove origin
git remote add origin https://github.com/emHung/GiaHung.git
git push -f https://github.com/emHung/GiaHung.git master:gh-pages
cd ..
echo Deployment complete! 
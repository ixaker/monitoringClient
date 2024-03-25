
<h3>Создание нового проекта</h3>

Сначала надо вручную создать репозиторий на github
https://github.com/ixaker?tab=repositories

Локально выполнить следующие команды:
rm -rf .git

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:ixaker/ИМЯ_РЕПОЗИТОРИЯ.git
git push -u origin main --force


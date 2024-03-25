
Создание нового проекта

Сначала надо вручную создать репозиторий на github


Локально выполнить следующие команды:
rm -rf .git

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:ixaker/monitoringClient.git
git push -u origin main --force

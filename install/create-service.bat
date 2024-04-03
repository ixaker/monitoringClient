@echo off
SETLOCAL ENABLEEXTENSIONS

:: Получение текущего пути к скрипту
SET scriptPath=%~dp0

:: Путь к nssm.exe относительно текущего пути скрипта
SET nssmPath=%scriptPath%nssm.exe

:: Название службы
SET serviceName=Monitoring

:: Создание службы
"%nssmPath%" install %serviceName% "%scriptPath%monitoring.exe"

:: Настройка автоматического перезапуска службы
"%nssmPath%" set %serviceName% AppExit Default Restart

:: Запуск службы
"%nssmPath%" start %serviceName%

:: Очистка переменных
SET nssmPath=
SET serviceName=
SET scriptPath=

:: Запрос на нажатие клавиши перед закрытием
pause

ENDLOCAL

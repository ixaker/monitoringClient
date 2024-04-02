@echo off
SETLOCAL ENABLEEXTENSIONS

:: Получение текущего пути к скрипту
SET scriptPath=%~dp0

:: Путь к инсталяционной папке
SET installPath=C:\soft

:: Создание директории, если она не существует
IF NOT EXIST "%installPath%" (
    MKDIR "%installPath%"
)

:: Копирование monitoring.exe в C:\soft
COPY /Y "%scriptPath%monitoring.exe" "%installPath%\monitoring.exe"

:: Путь к nssm.exe относительно текущего пути скрипта
SET nssmPath=%scriptPath%nssm.exe

:: Название службы
SET serviceName=Monitoring

:: Создание службы
"%nssmPath%" install %serviceName% "%installPath%\monitoring.exe"

:: Настройка автоматического перезапуска службы
"%nssmPath%" set %serviceName% AppExit Default Restart

:: Запуск службы
"%nssmPath%" start %serviceName%

:: Очистка переменных
SET installPath=
SET nssmPath=
SET serviceName=
SET scriptPath=

:: Запрос на нажатие клавиши перед закрытием
pause

ENDLOCAL

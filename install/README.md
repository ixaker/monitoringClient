# Инструкция по установке и управлению службой

Эта инструкция описывает процесс установки и управления службой Windows, созданной для запуска приложения `monitoring.exe` с помощью скрипта `create-service.bat`.

## Установка службы

1. **Запуск скрипта `create-service.bat`**:
    - Скрипт `create-service.bat` предназначен для создания службы, которая будет запускать `monitoring.exe` как службу Windows.
    - **Важно**: Запускайте скрипт с правами администратора. Для этого кликните правой кнопкой мыши по файлу скрипта и выберите "Запустить от имени администратора". Это необходимо для корректного создания службы и копирования файлов.

## Управление службой

После установки вы можете управлять службой через командную строку (открытую от имени администратора) или используя инструмент "Службы" в Windows.

### Запуск службы

cmd

	net start Monitoring

или

	sc start Monitoring


### Остановка службы

	net stop Monitoring

или

	sc stop Monitoring

### Просмотр статуса службы
	
	sc query Monitoring
	
### Удаление службы

	.\nssm remove Monitoring confirm

Запустите эту команду из директории, где находится nssm.exe, с правами администратора.
const WebSocket = require('ws');
const { exec } = require('child_process');

// Адрес вашего WSS сервера
const wsAddress = 'wss://monitoring.qpart.com.ua';

let ws;

// Функция для получения текущей загрузки CPU
function getCpuLoad(callback) {
    const command = `Get-Counter '\\Processor(_Total)\\% Processor Time' -ErrorAction SilentlyContinue | Foreach-Object { $_.CounterSamples[0].CookedValue }`;

    exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка выполнения: ${error}`);
            return callback(error, null);
        }
        if (stderr) {
            console.error(`Ошибка stderr: ${stderr}`);
            return callback(stderr, null);
        }
        // Вывод будет содержать новую строку, которую нужно убрать
        const cpuLoad = stdout.trim();
        console.log(`Текущая загрузка CPU: ${cpuLoad}%`);
        callback(null, cpuLoad);
    });
}

function sendDataPeriodically() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        getCpuLoad((error, cpuLoad) => {
            if (!error) {
                const message = JSON.stringify({ topic: 'cpuLoad', payload: cpuLoad });
                ws.send(message);
                console.log('Отправлена информация о загрузке CPU:', cpuLoad);
            } else {
                console.error('Ошибка при получении информации о загрузке CPU:', error);
            }
        });
    }
}

// Функция для создания нового WebSocket соединения
function connect() {
    ws = new WebSocket(wsAddress);
    setInterval(sendDataPeriodically, 10000);

    ws.on('open', function open() {
        console.log('Соединение успешно установлено');
        // Здесь можно отправить первичное сообщение серверу, если нужно
        const msg = {topic:"role", payload:"comp"};
        ws.send(JSON.stringify(msg));
    });

    ws.on('message', function incoming(data) {
        console.log('Получено сообщение: %s', data);
        // Обработка сообщений от сервера
        try {
            let {topic, payload } = JSON.parse(data);
            
            console.log('topic', topic);
            console.log('payload', payload);

            if (topic === 'cmnd') {
                exec(`powershell.exe -Command "${payload}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Ошибка выполнения: ${error}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Ошибка: ${stderr}`);
                        return;
                    }
                    console.log(`Результат: ${stdout}`);
                    // Отправка результата обратно на сервер, если необходимо
                    // ws.send(`Результат: ${stdout}`);
                });
            }



        } catch (error) {
            console.log('ERROR! ws.on - message', error)
        }
    });

    ws.on('close', function close() {
        console.log('Соединение закрыто, пытаюсь переподключиться...');
        setTimeout(connect, 10000); // Переподключение через 10 секунд
    });

    ws.on('error', function error(err) {
        console.error('Ошибка соединения:', err.message);
        // WebSocket будет автоматически закрыт после ошибки
    });
}

// Инициализация соединения
connect();

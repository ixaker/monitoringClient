require('dotenv').config();
const fs = require('fs');
const path = require('path');
const device = require('./device');
const { io } = require('socket.io-client');
const { execSync } = require('child_process');

const isAdmin = checkIfAdmin();
const devID = device.getID();
let nickname = process.env.nickname || '';
const socket = io('https://monitoring.qpart.com.ua:5000');

socket.on("connect_error", (error) => {
    console.error('Connect_error:', error.type, error);
});

socket.on("connect", () => {
    console.log('Connected to server');
    sendFullInfo();
    check();
});

socket.on(devID, (message) => {
    console.log('message', message);

    const { topic, payload } = message;
    const result = {'id': devID, 'topic': 'result'};

    if (topic === 'command') {
        result.result = device.runCommandPowerShell(payload);
        
        socket.emit('result', result);
    }else if (topic === 'nickname') {
        nickname = payload;
        updateEnvVariable('nickname', nickname);
    }

    sendFullInfo();
});

function sendFullInfo() {
    console.log('Start - sendFullInfo()');
    if (socket.connected) {
        const payload = device.getFullInfo(isAdmin, nickname);
        socket.emit('info', payload);
        console.info(payload);
    }
}

setInterval(sendFullInfo, 20000);

function checkIfAdmin() {
    try {
        execSync(`net session`, {stdio: 'ignore'}); // Вывод команды игнорируется
        console.log('Приложение запущено с правами администратора.');
        return true;
    } catch (error) {
        console.error('Приложение запущено без прав администратора.');
        return false;
    }
}

function check() {
    const payload = device.getFullInfo(isAdmin, nickname);

    payload.disk.forEach(element => {
        if (element.crypt) {
            let message = `Включился компьютер "${payload.name}" , и у него зашифрован диск '${element.mounted}'`;
            socket.emit('telegram', message);
        }
    });
}

function updateEnvVariable(key, value) {
    const envPath = path.resolve(process.cwd(), '.env');

    // Проверяем, существует ли файл .env
    if (!fs.existsSync(envPath)) {
        // Если файла нет, создаём его
        fs.writeFileSync(envPath, '', { flag: 'wx' }); // 'wx' - создать файл, только если он не существует
    }

    const envVars = fs.readFileSync(envPath, 'utf8').split('\n');
    
    const updatedEnvVars = envVars.map(line => {
      const [currentKey, currentValue] = line.split('=');
      if (currentKey === key) {
        return `${key}=${value}`;
      }
      return line;
    });
  
    if (!updatedEnvVars.some(line => line.startsWith(key))) {
      updatedEnvVars.push(`${key}=${value}`);
    }
  
    fs.writeFileSync(envPath, updatedEnvVars.join('\n'));
  }
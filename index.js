const device = require('./device');
const { io } = require('socket.io-client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isAdmin = checkIfAdmin();
const socket = io('http://monitoring.qpart.com.ua:5000', { extraHeaders: { "type": "device" }});



socket.on("connect_error", (error) => {
    console.error('Connect_error:', error.type, error);
});

socket.on("connect", () => {
    console.log('Connected to server');
    sendFullInfo();
});

socket.on("message", (data) => {
    const message = JSON.parse(data);
    const { topic, payload } = message;
    
    console.log('message', topic, payload);

    if (topic === 'command') {
        const result = {'id': device.getID()};
        result.result = device.runCommandPowerShell(payload);
        
        send('result', result);
        sendFullInfo();
    }
});

function send(topic, payload) {
    try {
        if (socket.connected) {
            console.log('send', topic);
            socket.send(JSON.stringify({ topic: topic, payload: payload }));    
        }    
    } catch (error) {
        console.error('send',topic, error);    
    }
    console.log('stop - send()');
}

function sendFullInfo() {
    console.log('Start - sendFullInfo()');
    if (socket.connected) {
        const payload = device.getFullInfo(isAdmin);
        send('info', payload);
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
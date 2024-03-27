const device = require('./device');
const { io } = require('socket.io-client');

const socket = io('http://monitoring.qpart.com.ua:5000', { extraHeaders: { "type": "device" }});

socket.on("connect_error", (error) => {
    console.error('connect_error:', error.type);
});

socket.on("connect", () => {
    console.log('connect');
});

socket.on("message", (message) => {
    const { topic, payload } = message;

    console.log('message', topic, payload);

    if (topic === 'command') {
        const payload = {'id': device.getID()};
        payload.result = device.runCommandPowerShell(payload);
        send('result', result);
        sendFullInfo();
    }
});

function send(topic, payload) {
    try {
        if (socket.connected) {
            //console.log('send', topic, payload);
            socket.send(JSON.stringify({ topic: topic, payload: payload }));    
        }    
    } catch (error) {
        console.log(error);    
    }
}

function sendFullInfo() {
    const payload = device.getFullInfo();
    send('info', payload);
}

setInterval(sendFullInfo, 10000);

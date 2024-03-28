const os = require('os');
const { execSync } = require('child_process');
const nodeDiskInfo = require('node-disk-info');
const { machineIdSync } = require('node-machine-id');

function runCommandPowerShell(command) {
    try {
        const stdout = execSync(`powershell.exe -Command "${command}"`, {encoding: 'utf8'});
        console.log(`Результат: ${stdout}`);
        return stdout;
    } catch (error) {
        console.error(`Ошибка выполнения: ${error}`);
        if (error.stderr) {
            console.error(`Ошибка: ${error.stderr}`);
        }
        return error;
    }
}

function getFullInfo(isAdmin) {
    const result = {role: 'comp', admin: isAdmin, errors:[]};

    try {
        result.name = os.hostname();    
    } catch (error) {
        result.name = 'error'; 
        result.errors.push({name: 'ERROR - os.hostname', error: error});
        console.log('ERROR - os.hostname', error);   
    }

    try {
        result.uptime = getUpTime();    
    } catch (error) {
        result.uptime = 'error'; 
        result.errors.push({name: 'ERROR - getUpTime', error: error});
        console.log('ERROR - getUpTime', error);   
    }

    try {
        result.network = getNetwork();    
    } catch (error) {
        result.network = ['error']; 
        result.errors.push({name: 'ERROR - getNetwork', error: error});
        console.log('ERROR - getNetwork', error);   
    }

    try {
        result.CPU = getInfoCPU();    
    } catch (error) {
        result.CPU = {model: 'error', load:0}; 
        result.errors.push({name: 'ERROR - getInfoCPU', error: error});
        console.log('ERROR - getInfoCPU', error);   
    }

    try {
        result.RAM = getInfoRAM();   
    } catch (error) {
        result.RAM = {model: 'error', load:0}; 
        result.errors.push({name: 'ERROR - getInfoRAM', error: error});
        console.log('ERROR - getInfoRAM', error);   
    }

    try {
        result.disk = getInfoDisk(result.errors, isAdmin);  
    } catch (error) {
        result.disk = []; 
        result.errors.push({name: 'ERROR - getInfoDisk', error: error});
        console.log('ERROR - getInfoDisk', error);   
    }

    try {
        result.id = getID();    
    } catch (error) {
        result.id = 'error';
        result.errors.push({name: 'ERROR - getID', error: error});
        console.log('ERROR - getID', error);
    }
    
    return result;
}

function getID() {
    let result = '';

    try {
        result = machineIdSync();    
    } catch (error) {
        result = 'error';
        console.log('ERROR - machineIdSync', error);
    }

    return result;
}

function getUpTime() {
    // Получение времени работы системы в секундах
    const uptimeInSeconds = os.uptime();

    // Расчет дней, часов, минут и секунд
    const days = Math.floor(uptimeInSeconds / (3600 * 24));
    const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);

    // получение правильно склоненного слова день
    const daysWord = getDaysWord(days);

    // Форматирование вывода
    const formattedUptime = `${days} ${daysWord} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return formattedUptime;
}

function getDaysWord(days) {
    if (days % 100 >= 11 && days % 100 <= 19) {
        return 'дней';
    } else {
        switch (days % 10) {
            case 1:
                return 'день';
            case 2:
            case 3:
            case 4:
                return 'дня';
            default:
                return 'дней';
        }
    }
}

function getInfoCPU() {
    const result = {};

    result.model = getModelCPU();
    result.load = getCpuLoad();

    return result;
}

function getCpuLoad() {
    const cpus = os.cpus();
    let totalIdleTime = 0;
    let totalTickTime = 0;

    cpus.forEach((cpu) => {
        const { idle, user, nice, sys, irq } = cpu.times;
        totalIdleTime += idle;
        totalTickTime += user + nice + sys + idle + irq;
    });

    const idleTimePerCpu = totalIdleTime / cpus.length;
    const totalTimePerCpu = totalTickTime / cpus.length;
    const totalLoad = Math.round((1 - idleTimePerCpu / totalTimePerCpu) * 100);

    return totalLoad;
}

function getModelCPU() {
    const cpus = os.cpus();
    if (cpus && cpus.length > 0) {
        const model = cpus[0].model.trim(); // Удаляем лишние пробелы
        return model;
    } else {
        return 'none';
    }
}

function getNetwork() {
    const networkInterfaces = os.networkInterfaces();
    const ipv4Addresses = [];

    // Перебираем все сетевые интерфейсы
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        const addresses = networkInterfaces[interfaceName];

        // Перебираем все адреса данного интерфейса
        addresses.forEach((addressInfo) => {
            // Фильтруем, оставляя только IPv4 адреса, исключая внутренние адреса (например, 127.0.0.1)
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                ipv4Addresses.push(addressInfo.address);
            }
        });
    });

    return ipv4Addresses;
}

function getInfoRAM() {
    const totalMem = os.totalmem() / 1024 / 1024 / 1024; // Преобразование из байтов в гигабайты
    const freeMem = os.freemem() / 1024 / 1024 / 1024; // Преобразование из байтов в гигабайты
    const usedMem = totalMem - freeMem;
    const usedMemPercentage = (usedMem / totalMem) * 100;

    return {
        total: +totalMem.toFixed(2) , // Всего памяти
        used: +usedMem.toFixed(2), // Использовано памяти
        procent: +usedMemPercentage.toFixed(2) // Процент использованной памяти
    };
}

function getInfoDisk(errors, isAdmin) {
    const disks = nodeDiskInfo.getDiskInfoSync();

    const diskInfo = disks.map(disk => {
    const totalGB = +(disk._blocks / 1024 / 1024 / 1024).toFixed(2); // Преобразование из байтов в гигабайты
    const usedGB = +(disk._used / 1024 / 1024 / 1024).toFixed(2); // Преобразование из байтов в гигабайты
    const availableGB = +(disk._available / 1024 / 1024 / 1024).toFixed(2); // Преобразование из байтов в гигабайты
    const capacity = parseInt(disk._capacity); // Удаление символа '%' и преобразование в число
    let bitLocker = { "crypt": false, "locked": false }

    try {
        if (isAdmin) {
            bitLocker = getInfoBitLocker(disk._mounted);
        }
        
    } catch (error) {
        errors.push({name: 'ERROR - getInfoBitLocker', error: `${disk._mounted} Ошибка при получении информации о BitLocker, возможно нет прав администратора`});
        console.error(`${disk._mounted} Ошибка при получении информации о BitLocker, возможно нет прав администратора`, error);
    }
    

    return {
        mounted: disk._mounted,
        total: totalGB,
        used: usedGB,
        available: availableGB,
        procent: capacity,
        crypt: bitLocker.crypt,
        locked: bitLocker.locked
    };
    });

    return diskInfo;
}

function getInfoBitLocker(drive) {
    const result = { "crypt": false, "locked": false };

    const output = execSync(`manage-bde -status ${drive}`).toString();

    // Проверяем, включен ли BitLocker
    if (output.includes('Conversion Status:    Fully Decrypted')) {
        result.crypt = false;
    }else{
        result.crypt = true;
    }

    // Проверяем, заблокирован ли диск
    if (output.includes('Lock Status:          Locked')) {
        result.locked = true;
    }

    return result;
}

module.exports = { getFullInfo, runCommandPowerShell, getID };
const { contextBridge, ipcRenderer } = require('electron');
const { execSync, spawn } = require("child_process");

contextBridge.exposeInMainWorld('electron', {
  myPing() {

    return execSync("docker ps --format='{{json .}}' | jq --slurp").toString();
  },
  runScript(handler, errorHandler) {
      const process = spawn('sudo', ['bash', '/home/koitu/docker-migrate.sh']);
      process.stdout.on('data', (data) => handler(data.toString()));
      process.stderr.on('data', (data) => handler(data.toString()));
      process.on('close', (code) => {
        handler("child process exited with code " + code);
        errorHandler();
      });
      return process;
  },
  ipcRenderer: {
    myPing() {

    },
    on(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
  },
});

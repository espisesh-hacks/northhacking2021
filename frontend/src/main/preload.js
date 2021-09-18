const { contextBridge, ipcRenderer } = require('electron');
const {execSync} = require("child_process");

contextBridge.exposeInMainWorld('electron', {
  myPing() {

    return execSync("docker ps --format='{{json .}}' | jq --slurp").toString();
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

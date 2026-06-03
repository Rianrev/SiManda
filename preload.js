const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Called when a new version has been downloaded and is ready to install
  onUpdateReady: (callback) => {
    ipcRenderer.on('update-downloaded', (_event, version) => callback(version))
  },
  // Tell main process to quit and install the downloaded update
  restartToUpdate: () => ipcRenderer.send('restart-to-update'),
})

const { contextBridge, ipcRenderer } = require('electron')

let appVersion = ''
try { appVersion = ipcRenderer.sendSync('get-app-version-sync') } catch (_) {}

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_e, version) => cb(version)),
  onUpdateProgress:  (cb) => ipcRenderer.on('update-progress',  (_e, pct)     => cb(pct)),
  onUpdateReady:     (cb) => ipcRenderer.on('update-downloaded', (_e, version) => cb(version)),
  getUpdateStatus:   ()   => ipcRenderer.invoke('get-update-status'),
  restartToUpdate:   ()   => ipcRenderer.send('restart-to-update'),
  openExternal:      (url) => ipcRenderer.send('open-external', url),
  appsScript:        (url, payload) => ipcRenderer.invoke('apps-script', { url, payload }),
  appVersion,
})

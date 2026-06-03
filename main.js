const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('node:path')
const { mainMenu } = require('./menumaker')
const { autoUpdater } = require('electron-updater')

// Handle Squirrel install/uninstall events on Windows
if (require('electron-squirrel-startup')) app.quit()

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    icon: path.join(__dirname, 'src/assets/img/logo1.ico')
  })

  Menu.setApplicationMenu(mainMenu)
  win.loadFile('./src/login.html')
  return win
}

app.whenReady().then(() => {
  const win = createWindow()

  // Check for updates silently after window loads
  win.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch(() => {})
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Notify all windows when update is downloaded and ready to install
autoUpdater.on('update-downloaded', (info) => {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('update-downloaded', info.version)
  })
})

// Renderer requests restart to install update
ipcMain.on('restart-to-update', () => {
  autoUpdater.quitAndInstall()
})

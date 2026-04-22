const { app, BrowserWindow, Menu, session } = require('electron')
const path = require('node:path')
const { mainMenu } = require( './menumaker' ) 

const createWindow = () => {
    const win = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webviewTag : true
      },
      icon: path.join(__dirname, 'src/assets/img/logo1.ico')
    })
    
    Menu.setApplicationMenu(mainMenu)

    win.loadFile('./src/login.html')
}


app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
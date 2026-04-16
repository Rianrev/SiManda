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
      icon:'./src/assets/img/logo1.png'
    })
    
    Menu.setApplicationMenu(mainMenu)

    win.loadFile('./src/index.html')
}


app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.tailwindcss.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' https://docs.google.com https://*.googleusercontent.com; " +
          "frame-src https://docs.google.com https://accounts.google.com;"
        ]
      }
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
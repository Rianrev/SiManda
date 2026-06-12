const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const path = require('node:path')
const fsp = require('node:fs/promises')
const log = require('electron-log')
const { mainMenu } = require('./menumaker')
const { autoUpdater } = require('electron-updater')

if (require('electron-squirrel-startup')) app.quit()

log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = true
// Jangan install diam-diam saat app ditutup — update hanya dipasang kalau
// user klik tombol "Restart & Install" (memanggil quitAndInstall).
autoUpdater.autoInstallOnAppQuit = false

// Persistent update state — so any page (re)loaded later can query current status
const updateState = {
  status: 'idle',   // idle | downloading | ready
  version: null,
  percent: 0,
}

function broadcast(channel, payload) {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  })
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}

// STEP 1: Check the local updater cache directly — fast, works offline.
// If a newer installer is already downloaded, show the notification immediately
// without waiting for the GitHub round-trip.
async function checkCachedUpdate() {
  try {
    const baseDir = process.env.LOCALAPPDATA || app.getPath('appData')
    const pendingDir = path.join(baseDir, 'simanda-updater', 'pending')
    const info = JSON.parse(await fsp.readFile(path.join(pendingDir, 'update-info.json'), 'utf-8'))
    if (!info || !info.fileName) return

    await fsp.access(path.join(pendingDir, info.fileName)) // installer must physically exist

    const m = info.fileName.match(/(\d+\.\d+\.\d+)/)
    if (!m) return
    const cachedVersion = m[1]

    if (compareVersions(cachedVersion, app.getVersion()) <= 0) return // not newer than current

    log.info(`Local cache: update ${cachedVersion} already downloaded (current ${app.getVersion()})`)
    updateState.status = 'ready'
    updateState.version = cachedVersion
    updateState.percent = 100
    broadcast('update-downloaded', cachedVersion)
  } catch (_) {
    // no cache / unreadable — ignore; the GitHub check will handle it
  }
}

autoUpdater.on('checking-for-update',  () => log.info('Checking for update...'))
autoUpdater.on('update-not-available', (i) => log.info('No update. Current is latest:', i.version))
autoUpdater.on('error',                (e) => log.error('Updater error:', e == null ? 'unknown' : (e.stack || e).toString()))

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version)
  // Only flip to "downloading" UI if we aren't already showing a ready (cached) update
  if (updateState.status !== 'ready') {
    updateState.status = 'downloading'
    updateState.version = info.version
    updateState.percent = 0
    broadcast('update-available', info.version)
  }
})

autoUpdater.on('download-progress', (progress) => {
  const pct = Math.round(progress.percent)
  log.info(`Downloading: ${pct}%`)
  updateState.status = 'downloading'
  updateState.percent = pct
  broadcast('update-progress', pct)
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version)
  updateState.status = 'ready'
  updateState.version = info.version
  updateState.percent = 100
  broadcast('update-downloaded', info.version)
})

// Renderer queries current update status on load (handles already-downloaded case)
ipcMain.handle('get-update-status', () => updateState)

// Renderer requests restart to install update
ipcMain.on('restart-to-update', () => {
  autoUpdater.quitAndInstall()
})

// Buka URL (mis. link download Google Drive) di browser eksternal
ipcMain.on('open-external', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    shell.openExternal(url)
  }
})

// Versi aplikasi (sinkron) untuk ditampilkan di sidebar
ipcMain.on('get-app-version-sync', (e) => {
  e.returnValue = app.getVersion()
})

// ID unik per sesi-aplikasi → dipakai memvalidasi login (wajib login tiap app dibuka)
const RUN_ID = Date.now().toString(36) + Math.random().toString(36).slice(2)
ipcMain.on('get-run-id-sync', (e) => {
  e.returnValue = RUN_ID
})

// Proxy request ke Apps Script Web App (dilakukan di main → hindari CORS renderer)
ipcMain.handle('apps-script', async (_e, { url, payload }) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000) // 30 dtk: cegah hang di jaringan lambat
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    })
    const text = await res.text()
    try { return JSON.parse(text) }
    catch { return { ok: false, error: 'Respon tidak valid dari server: ' + text.slice(0, 200) } }
  } catch (e) {
    if (e && e.name === 'AbortError') {
      return { ok: false, error: 'Koneksi timeout (30 detik). Periksa jaringan Anda lalu coba lagi.' }
    }
    return { ok: false, error: 'Gagal terhubung ke server. Periksa jaringan Anda. (' + String((e && e.message) || e) + ')' }
  } finally {
    clearTimeout(timer)
  }
})

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

  win.webContents.once('did-finish-load', async () => {
    await checkCachedUpdate()                       // 1. local cache → instant notif
    autoUpdater.checkForUpdates().catch(() => {})   // 2. GitHub → validate + find newer
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

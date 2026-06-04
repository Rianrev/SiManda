(function () {
  if (!window.electronAPI) return

  // Tampilkan versi app di sidebar (sidebar dimuat async via fetch, jadi pakai observer)
  function fillAppVersion() {
    const el = document.getElementById('appVersion')
    if (!el) return false
    if (window.electronAPI.appVersion) el.textContent = 'v' + window.electronAPI.appVersion
    return true
  }
  if (!fillAppVersion()) {
    const obs = new MutationObserver(() => { if (fillAppVersion()) obs.disconnect() })
    obs.observe(document.documentElement, { childList: true, subtree: true })
  }

  function getBanner() { return document.getElementById('update-banner') }

  function showBanner() {
    const b = getBanner()
    if (!b) return
    b.classList.remove('hidden')
    b.classList.add('flex')
  }

  function hideBanner() {
    const b = getBanner()
    if (!b) return
    b.classList.add('hidden')
    b.classList.remove('flex')
  }

  // Render the "downloading" banner (spinner + progress bar)
  function renderDownloading(version, percent) {
    const b = getBanner()
    if (!b) return
    b.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold">Mengunduh Pembaruan</p>
          <p class="text-slate-400 text-xs mt-0.5">Versi ${version} sedang diunduh...</p>
          <div class="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div id="update-progress-bar" class="h-full bg-blue-500 rounded-full transition-all duration-300" style="width:${percent}%"></div>
          </div>
          <p id="update-progress-text" class="text-slate-500 text-xs mt-1">${percent}%</p>
        </div>
      </div>
    `
    showBanner()
  }

  // Render the "ready to install" banner
  function renderReady(version) {
    const b = getBanner()
    if (!b) return
    b.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold">Update Tersedia</p>
          <p class="text-slate-400 text-xs mt-0.5">Versi ${version} siap diinstal</p>
        </div>
        <button id="update-dismiss" class="text-slate-500 hover:text-slate-300 transition text-lg leading-none">&times;</button>
      </div>
      <button id="update-restart-btn" class="w-full py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Restart &amp; Install Update
      </button>
    `
    showBanner()
    document.getElementById('update-restart-btn')?.addEventListener('click', () => {
      window.electronAPI.restartToUpdate()
    })
    document.getElementById('update-dismiss')?.addEventListener('click', hideBanner)
  }

  function updateProgress(pct) {
    const bar  = document.getElementById('update-progress-bar')
    const text = document.getElementById('update-progress-text')
    if (bar)  bar.style.width  = pct + '%'
    if (text) text.textContent = pct + '%'
  }

  // Live events
  window.electronAPI.onUpdateAvailable((version) => renderDownloading(version, 0))
  window.electronAPI.onUpdateProgress(updateProgress)
  window.electronAPI.onUpdateReady((version) => renderReady(version))

  // On page load: query current status so a download that happened on a
  // previous page (or a previous app run) still shows up here.
  async function syncStatus() {
    try {
      const state = await window.electronAPI.getUpdateStatus()
      if (!state) return
      if (state.status === 'ready') {
        renderReady(state.version)
      } else if (state.status === 'downloading') {
        renderDownloading(state.version, state.percent)
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncStatus)
  } else {
    syncStatus()
  }
})()

if (window.electronAPI?.onUpdateReady) {
  window.electronAPI.onUpdateReady((version) => {
    const banner = document.getElementById('update-banner')
    const versionText = document.getElementById('update-version-text')
    if (!banner) return
    if (versionText) versionText.textContent = `Versi ${version} siap diinstal`
    banner.classList.remove('hidden')
    banner.classList.add('flex')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('update-restart-btn')?.addEventListener('click', () => {
    window.electronAPI?.restartToUpdate()
  })
  document.getElementById('update-dismiss')?.addEventListener('click', () => {
    const banner = document.getElementById('update-banner')
    banner?.classList.add('hidden')
    banner?.classList.remove('flex')
  })
})

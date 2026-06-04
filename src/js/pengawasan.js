const session = getSession()
if (session) {
  document.getElementById('userBadge').textContent = session.region === '*' ? 'Master' : session.region
}

const pageTitle = document.body.dataset.title || ''
if (pageTitle) document.getElementById('pageTitle').textContent = pageTitle

;(() => {
  const toggleBtn = document.getElementById('toggleBtn')
  const sidebar   = document.getElementById('sidebar')
  const main      = document.getElementById('main')
  let open = true
  toggleBtn.addEventListener('click', () => {
    open = !open
    sidebar.classList.toggle('-translate-x-full', !open)
    main.classList.toggle('ml-64', open)
    main.classList.toggle('ml-0', !open)
  })

  fetch('sidebar.html').then(r => r.text()).then(html => {
    sidebar.innerHTML = html

    const all = sidebar.querySelectorAll('details')
    all.forEach(det => {
      det.addEventListener('toggle', () => {
        if (det.open) all.forEach(other => { if (other !== det) other.open = false })
      })
    })

    const currentPage = window.location.pathname.split('/').pop()
    for (const a of sidebar.querySelectorAll('a')) {
      try {
        const u = new URL(a.href, window.location.href)
        if (u.pathname.split('/').pop() === currentPage) {
          a.classList.add('active')
          const det = a.closest('details')
          if (det) det.open = true
          break
        }
      } catch (_) {}
    }
  }).catch(() => {})
})()

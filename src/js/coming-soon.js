const session = getSession()
if (session) {
  document.getElementById('userBadge').textContent = session.username
}

const params = new URLSearchParams(window.location.search)
const title = params.get('title')
if (title) {
  document.getElementById('pageTitle').textContent = title
  document.getElementById('pageSubtitle').textContent =
    `Fitur "${title}" sedang dalam tahap pengembangan dan akan segera tersedia.`
}

document.getElementById('toggleBtn').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar')
  const main = document.getElementById('main')
  const hidden = sidebar.style.transform === 'translateX(-100%)'
  sidebar.style.transform = hidden ? '' : 'translateX(-100%)'
  main.style.marginLeft = hidden ? '16rem' : '0'
})

document.addEventListener('DOMContentLoaded', () => {
  fetch('sidebar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('sidebar').innerHTML = html
      document.querySelectorAll('#sidebar details').forEach(d => {
        d.querySelector('summary').addEventListener('click', () => {
          document.querySelectorAll('#sidebar details').forEach(o => { if (o !== d) o.removeAttribute('open') })
        })
      })
      document.querySelectorAll('#sidebar a').forEach(a => {
        if (a.href === window.location.href) a.classList.add('active')
      })
    })
    .catch(() => {})
})

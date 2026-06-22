// Script halaman Pengawasan Terpadu / E-SAKIP (halaman "Segera Hadir").
// Cukup tampilkan region user, muat sidebar, dan highlight menu aktif.

const session = getSession()
if (session) {
  document.getElementById('userBadge').textContent =
    session.region === '*' ? 'Master' : session.region
}

// Judul halaman diambil dari atribut data-title di <body>.
const judul = document.body.dataset.title || ''
if (judul) document.getElementById('pageTitle').textContent = judul

// Tombol buka/tutup sidebar.
function aktifkanToggleSidebar() {
  const tombol  = document.getElementById('toggleBtn')
  const sidebar = document.getElementById('sidebar')
  const konten  = document.getElementById('main')
  let terbuka = true
  tombol.addEventListener('click', () => {
    terbuka = !terbuka
    sidebar.classList.toggle('-translate-x-full', !terbuka)
    konten.classList.toggle('ml-64', terbuka)
    konten.classList.toggle('ml-0', !terbuka)
  })
}

// Accordion: hanya satu grup menu terbuka pada satu waktu.
function aturAccordionSidebar(sidebar) {
  const semuaGrup = sidebar.querySelectorAll('details')
  semuaGrup.forEach(grup => {
    grup.addEventListener('toggle', () => {
      if (grup.open) semuaGrup.forEach(lain => { if (lain !== grup) lain.open = false })
    })
  })
}

// Highlight link sidebar yang cocok dengan halaman yang sedang dibuka.
function highlightMenuAktif(sidebar) {
  const halamanSekarang = window.location.pathname.split('/').pop()
  for (const link of sidebar.querySelectorAll('a')) {
    const href = link.getAttribute('href')
    if (!href || href.charAt(0) === '#') continue // lewati link non-navigasi (mis. Survey)
    try {
      const tujuan = new URL(link.href, window.location.href)
      if (tujuan.pathname.split('/').pop() === halamanSekarang) {
        link.classList.add('active')
        const grup = link.closest('details')
        if (grup) grup.open = true
        break
      }
    } catch (_) {}
  }
}

aktifkanToggleSidebar()
fetch('sidebar.html').then(r => r.text()).then(html => {
  const sidebar = document.getElementById('sidebar')
  sidebar.innerHTML = html
  filterSidebar()
  aturAccordionSidebar(sidebar)
  highlightMenuAktif(sidebar)
}).catch(() => {})

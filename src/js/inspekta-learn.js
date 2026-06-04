// ============================================================
//  INSPEKTA LEARN — daftar materi yang bisa diunduh
//  Ganti `url` dengan link download asli (sekarang masih dummy '#').
// ============================================================
const MATERIALS = [
  {
    title: 'Sosialisasi Evaluasi Pembangunan Zona Integritas Tahun 2026',
    desc:  'Materi sosialisasi evaluasi pembangunan Zona Integritas tahun 2026 yang disampaikan kepada Satker yang lulus seleksi awal dan tahap berikutnya.',
    date:  '2026-04-16',
    url:   'https://drive.google.com/file/d/1izoi1K32gDerig0GW5Ye96rrQdhhcHGZ/view',
  },
  {
    title: 'Sosialisasi Kebijakan Konflik Kepentingan',
    desc:  'Materi sosialisasi mengenai kebijakan pengelolaan Konflik Kepentingan dari MenPAN-RB.',
    date:  '2026-04-24',
    url:   'https://drive.google.com/file/d/1yimp1lkhdBqgrR7bW3bidKxC6GSg8kHA/view',
  },
  {
    title: 'Implementasi COI',
    desc:  'Materi Kegiatan Bisa Tanya RBKunWAS tentang Conflict of Interest.',
    date:  '2026-04-08',
    url:   'https://drive.google.com/file/d/11IPnOqxPYccDwCJ16EiV81YUqh6rmQDb/view',
  },
  {
    title: 'Evaluasi AKIP Internal',
    desc:  'Materi Kegiatan Bisa Tanya RBKunWAS tentang Evaluasi AKIP Internal.',
    date:  '2026-03-04',
    url:   'https://drive.google.com/file/d/1KMqFvkqIuDUyveeyuwO-GIsyDBf9A7NC/view',
  },
  {
    title: 'Perjanjian Kinerja',
    desc:  'Materi Kegiatan Bisa Tanya RBKunWAS tentang Perjanjian Kinerja.',
    date:  '2026-02-25',
    url:   'https://drive.google.com/file/d/12SshnzNlZIJJ0ga31NMrEcMPmMZxS7TA/view',
  },
]

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

// Ubah berbagai bentuk link Google Drive menjadi URL direct-download.
// Mendukung: .../file/d/ID/view, open?id=ID, uc?id=ID. Selain Drive → biarkan apa adanya.
function resolveDownloadUrl(url) {
  if (!url || url === '#') return url
  let id = null
  let m = url.match(/\/file\/d\/([A-Za-z0-9_-]+)/)
  if (m) id = m[1]
  if (!id) { m = url.match(/[?&]id=([A-Za-z0-9_-]+)/); if (m) id = m[1] }
  if (id && /drive\.google\.com|docs\.google\.com/.test(url)) {
    return `https://drive.google.com/uc?export=download&id=${id}`
  }
  return url
}

function cardHtml(m) {
  return `
    <div class="group flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-blue-950/40 transition-all duration-200">
      <div class="mb-4">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-950/40 shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
      </div>
      <h3 class="text-white font-semibold text-[15px] leading-snug mb-2 line-clamp-2">${escapeHtml(m.title)}</h3>
      <p class="text-slate-400 text-sm leading-relaxed line-clamp-3 flex-1">${escapeHtml(m.desc)}</p>
      <a href="${escapeHtml(resolveDownloadUrl(m.url))}" data-download
        class="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Unduh File
      </a>
    </div>
  `
}

function render(list) {
  const grid = document.getElementById('cardGrid')
  const empty = document.getElementById('emptyState')
  if (!list.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    empty.classList.add('flex')
    return
  }
  empty.classList.add('hidden')
  empty.classList.remove('flex')
  grid.innerHTML = list.map(cardHtml).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  render(MATERIALS)

  // Klik tombol unduh → buka URL di browser eksternal (agar Drive bisa men-download
  // file & menangani halaman konfirmasi/login). Cegah app menavigasi ke link.
  document.getElementById('cardGrid').addEventListener('click', (e) => {
    const link = e.target.closest('a[data-download]')
    if (!link) return
    const url = link.getAttribute('href')
    if (!url || url === '#') { e.preventDefault(); return }
    if (window.electronAPI?.openExternal) {
      e.preventDefault()
      window.electronAPI.openExternal(url)
    }
    // tanpa Electron (dev di browser): biarkan default membuka tab baru
  })
})

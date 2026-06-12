// ============================================================
//  INPUT TARGET — isi/ubah target per Fokus Prioritas
//  Belum ada utk tahun itu → append. Sudah ada → update kolom D,E.
// ============================================================
const params = new URLSearchParams(window.location.search)
const satker = params.get('satker') || ''          // nama tab (mis. "Aceh")

const satkerLabelEl = document.getElementById('satkerLabel')
const tahunSelect   = document.getElementById('tahunSelect')
const rowsEl        = document.getElementById('rows')
const submitBtn     = document.getElementById('submitBtn')

satkerLabelEl.textContent = satker
tahunSelect.innerHTML = `<option value="${TAHUN_BERJALAN}">${TAHUN_BERJALAN}</option>`

// fokus → { row } untuk tahun terpilih (baris yang sudah ada di sheet)
let existingMap = {}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function setStatus(msg, type) {
  const el = document.getElementById('statusMsg')
  el.textContent = msg
  el.className = 'text-sm ' + (type === 'error' ? 'text-red-600' : type === 'ok' ? 'text-green-600' : 'text-slate-500')
}

// Render baris kosong dulu
rowsEl.innerHTML = FOKUS_PRIORITAS.map((fokus, i) => `
  <div class="grid grid-cols-12 gap-3 px-5 py-3 items-center border-b border-slate-100 last:border-0">
    <div class="col-span-6 text-sm text-slate-700">${escapeHtml(fokus)}</div>
    <div class="col-span-3">
      <input type="number" min="0" data-i="${i}" data-f="output" placeholder="0"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40">
    </div>
    <div class="col-span-3">
      <input type="text" inputmode="numeric" data-i="${i}" data-f="anggaran" placeholder="0"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40">
    </div>
  </div>
`).join('')

rowsEl.querySelectorAll('input[data-f="anggaran"]').forEach(attachRupiah)

// Muat nama satker (A1) + target yang sudah ada
async function init() {
  appsScriptRequest({ action: 'info', sheet: satker }).then((res) => {
    if (res && res.ok && res.satker) {
      satkerLabelEl.textContent = res.satker + (res.satker !== satker ? ` (${satker})` : '')
    }
  })

  showInputLoading('Memuat data target…')
  const res = await appsScriptRequest({ action: 'list', sheet: satker })
  hideInputLoading()
  if (!res || !res.ok || !Array.isArray(res.rows)) {
    // Gagal muat → jangan lanjut (risiko data ganda kalau ternyata sudah ada target)
    showResultDialog(false, ((res && res.error) || 'Gagal memuat data') + '\n\nBuka kembali halaman ini setelah jaringan stabil.', inputGoBack)
    return
  }

  existingMap = {}
  res.rows.forEach((r) => {
    const fokus = String(r.values[COL.FOKUS - 1] || '').trim()
    const tahun = Number(r.values[COL.TAHUN - 1])
    if (tahun !== TAHUN_BERJALAN) return
    const i = FOKUS_PRIORITAS.indexOf(fokus)
    if (i === -1) return
    existingMap[fokus] = { row: r.row }
    const out = r.values[COL.TARGET_OUTPUT - 1]
    const ang = r.values[COL.TARGET_ANGGARAN - 1]
    const oEl = document.querySelector(`input[data-i="${i}"][data-f="output"]`)
    const aEl = document.querySelector(`input[data-i="${i}"][data-f="anggaran"]`)
    if (oEl && out !== '' && out != null) oEl.value = out
    if (aEl && ang !== '' && ang != null) aEl.value = formatRupiah(ang)
  })

  if (Object.keys(existingMap).length) {
    setStatus(`Target ${TAHUN_BERJALAN} sudah ada — perubahan akan memperbarui data.`, 'info')
    submitBtn.querySelector('span').textContent = 'Perbarui Target'
  }
}

submitBtn.addEventListener('click', async () => {
  const tahun = Number(tahunSelect.value)

  // Server (upsertTarget) yang memutuskan append/update secara atomik di dalam
  // lock — aman walau beberapa user submit bersamaan (tidak ada baris ganda).
  const items = []
  FOKUS_PRIORITAS.forEach((fokus, i) => {
    const output   = document.querySelector(`input[data-i="${i}"][data-f="output"]`).value.trim()
    const anggaran = document.querySelector(`input[data-i="${i}"][data-f="anggaran"]`).value.trim()
    if (output === '' && anggaran === '') return // lewati baris kosong
    items.push({
      no:       i + 1,
      fokus:    fokus,
      output:   output === '' ? '' : Number(output),
      anggaran: parseRupiah(anggaran),
    })
  })

  if (!items.length) { setStatus('Isi minimal satu Fokus Prioritas.', 'error'); return }
  if (!satker) { setStatus('Satker tidak diketahui.', 'error'); return }

  submitBtn.disabled = true
  showInputLoading('Menyimpan…')

  const r = await appsScriptRequest({ action: 'upsertTarget', sheet: satker, tahun, items })
  hideInputLoading()

  if (r && r.ok) {
    const parts = []
    if (r.added) parts.push(`${r.added} baru`)
    if (r.updated) parts.push(`${r.updated} diperbarui`)
    showResultDialog(true, `Data target berhasil disimpan (${parts.join(', ') || 'tidak ada perubahan'}).`, inputGoBack)
  } else {
    submitBtn.disabled = false
    showResultDialog(false, 'Gagal menyimpan: ' + ((r && r.error) || 'tidak diketahui'), null)
  }
})

init()

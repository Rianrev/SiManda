// ============================================================
//  INPUT TARGET — append baris target ke tab Satker
// ============================================================
const params = new URLSearchParams(window.location.search)
const satker = params.get('satker') || ''          // nama tab (mis. "Aceh")
const satkerName = SATKER_MAP[satker] || satker     // nama resmi untuk kolom Satker

document.getElementById('satkerLabel').textContent =
  satkerName + (satkerName !== satker ? ` (${satker})` : '')

// Dropdown tahun — hanya tahun berjalan
const tahunSelect = document.getElementById('tahunSelect')
tahunSelect.innerHTML = `<option value="${TAHUN_BERJALAN}">${TAHUN_BERJALAN}</option>`

// Render baris Fokus Prioritas
const rowsEl = document.getElementById('rows')
rowsEl.innerHTML = FOKUS_PRIORITAS.map((fokus, i) => `
  <div class="grid grid-cols-12 gap-3 px-5 py-3 items-center border-b border-slate-100 last:border-0">
    <div class="col-span-6 text-sm text-slate-700">${escapeHtml(fokus)}</div>
    <div class="col-span-3">
      <input type="number" min="0" data-i="${i}" data-f="output" placeholder="0"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40">
    </div>
    <div class="col-span-3">
      <input type="number" min="0" data-i="${i}" data-f="anggaran" placeholder="0"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40">
    </div>
  </div>
`).join('')

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

const submitBtn = document.getElementById('submitBtn')

submitBtn.addEventListener('click', async () => {
  const tahun = tahunSelect.value
  const rows = []

  FOKUS_PRIORITAS.forEach((fokus, i) => {
    const output   = document.querySelector(`input[data-i="${i}"][data-f="output"]`).value.trim()
    const anggaran = document.querySelector(`input[data-i="${i}"][data-f="anggaran"]`).value.trim()
    if (output === '' && anggaran === '') return // lewati baris kosong

    // Susun baris sesuai posisi kolom A..K (11 kolom)
    const row = new Array(11).fill('')
    row[COL.NO - 1]              = i + 1
    row[COL.SATKER - 1]         = satkerName
    row[COL.FOKUS - 1]          = fokus
    row[COL.TARGET_OUTPUT - 1]  = output === '' ? '' : Number(output)
    row[COL.TARGET_ANGGARAN - 1] = anggaran === '' ? '' : Number(anggaran)
    row[COL.TAHUN - 1]          = Number(tahun)
    rows.push(row)
  })

  if (!rows.length) { setStatus('Isi minimal satu Fokus Prioritas.', 'error'); return }
  if (!satker)      { setStatus('Satker tidak diketahui.', 'error'); return }

  submitBtn.disabled = true
  submitBtn.style.opacity = '0.5'
  submitBtn.style.cursor = 'not-allowed'
  setStatus('Menyimpan…', 'info')

  const res = await appsScriptRequest({ action: 'append', sheet: satker, rows })

  if (res && res.ok) {
    setStatus(`Berhasil menyimpan ${res.added} target. Mengarahkan kembali…`, 'ok')
    setTimeout(() => history.back(), 1200)
  } else {
    submitBtn.disabled = false
    submitBtn.style.opacity = ''
    submitBtn.style.cursor = ''
    setStatus('Gagal menyimpan: ' + ((res && res.error) || 'tidak diketahui'), 'error')
  }
})

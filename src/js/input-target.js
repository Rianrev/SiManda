// ============================================================
//  INPUT TARGET — isi/ubah target (output & anggaran) per Fokus Prioritas.
//  Hanya untuk tahun berjalan. Server (upsertTarget) yang memutuskan
//  baris baru (append) atau perbarui baris lama, secara atomik di dalam lock.
// ============================================================
const params = new URLSearchParams(window.location.search)
const satker = params.get('satker') || ''   // nama tab sheet (mis. "Aceh")

const labelSatker = document.getElementById('satkerLabel')
const tahunSelect = document.getElementById('tahunSelect')
const wadahBaris  = document.getElementById('rows')
const submitBtn   = document.getElementById('submitBtn')

labelSatker.textContent = satker
tahunSelect.innerHTML = `<option value="${TAHUN_BERJALAN}">${TAHUN_BERJALAN}</option>`

// Fokus yang sudah punya baris target di sheet (untuk tahun berjalan).
let fokusSudahAda = {}   // { [namaFokus]: true }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function setStatus(pesan, tipe) {
  const el = document.getElementById('statusMsg')
  el.textContent = pesan
  el.className = 'text-sm ' + (tipe === 'error' ? 'text-red-600' : tipe === 'ok' ? 'text-green-600' : 'text-slate-500')
}

// Cari input output/anggaran milik baris fokus ke-i.
function inputBaris(i, jenis) {
  return document.querySelector(`input[data-i="${i}"][data-f="${jenis}"]`)
}

// Render satu baris kosong per Fokus Prioritas.
wadahBaris.innerHTML = FOKUS_PRIORITAS.map((fokus, i) => `
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

wadahBaris.querySelectorAll('input[data-f="anggaran"]').forEach(attachRupiah)

// Muat nama satker (A1) + target tahun berjalan yang sudah ada → isi ke form.
async function muatData() {
  appsScriptRequest({ action: 'info', sheet: satker }).then(res => {
    if (res && res.ok && res.satker) {
      labelSatker.textContent = res.satker + (res.satker !== satker ? ` (${satker})` : '')
    }
  })

  showInputLoading('Memuat data target…')
  const res = await appsScriptRequest({ action: 'list', sheet: satker })
  hideInputLoading()
  if (!res || !res.ok || !Array.isArray(res.rows)) {
    // Gagal muat → jangan lanjut (risiko data ganda kalau ternyata target sudah ada).
    showResultDialog(false, ((res && res.error) || 'Gagal memuat data') + '\n\nBuka kembali halaman ini setelah jaringan stabil.', inputGoBack)
    return
  }

  fokusSudahAda = {}
  res.rows.forEach(baris => {
    const fokus = String(baris.values[COL.FOKUS - 1] || '').trim()
    const tahun = Number(baris.values[COL.TAHUN - 1])
    if (tahun !== TAHUN_BERJALAN) return
    const i = FOKUS_PRIORITAS.indexOf(fokus)
    if (i === -1) return

    fokusSudahAda[fokus] = true
    const output   = baris.values[COL.TARGET_OUTPUT - 1]
    const anggaran = baris.values[COL.TARGET_ANGGARAN - 1]
    if (output !== '' && output != null) inputBaris(i, 'output').value = output
    if (anggaran !== '' && anggaran != null) inputBaris(i, 'anggaran').value = formatRupiah(anggaran)
  })

  if (Object.keys(fokusSudahAda).length) {
    setStatus(`Target ${TAHUN_BERJALAN} sudah ada — perubahan akan memperbarui data.`, 'info')
    submitBtn.querySelector('span').textContent = 'Perbarui Target'
  }
}

submitBtn.addEventListener('click', async () => {
  const tahun = Number(tahunSelect.value)

  const items = []
  FOKUS_PRIORITAS.forEach((fokus, i) => {
    const output   = inputBaris(i, 'output').value.trim()
    const anggaran = inputBaris(i, 'anggaran').value.trim()
    if (output === '' && anggaran === '') return // lewati baris kosong
    items.push({
      no:       i + 1,
      fokus,
      output:   output === '' ? '' : Number(output),
      anggaran: parseRupiah(anggaran),
    })
  })

  if (!items.length) { setStatus('Isi minimal satu Fokus Prioritas.', 'error'); return }
  if (!satker) { setStatus('Satker tidak diketahui.', 'error'); return }

  submitBtn.disabled = true
  showInputLoading('Menyimpan…')

  const res = await appsScriptRequest({ action: 'upsertTarget', sheet: satker, tahun, items })
  hideInputLoading()

  if (res && res.ok) {
    const ringkasan = []
    if (res.added) ringkasan.push(`${res.added} baru`)
    if (res.updated) ringkasan.push(`${res.updated} diperbarui`)
    showResultDialog(true, `Data target berhasil disimpan (${ringkasan.join(', ') || 'tidak ada perubahan'}).`, inputGoBack)
  } else {
    submitBtn.disabled = false
    showResultDialog(false, 'Gagal menyimpan: ' + ((res && res.error) || 'tidak diketahui'), null)
  }
})

muatData()

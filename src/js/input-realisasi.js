// ============================================================
//  INPUT REALISASI — update kolom realisasi pada baris target
//  Sem I → kolom G,H · Sem II → kolom I,J · Hambatan/Pendukung → K,L
// ============================================================
const params = new URLSearchParams(window.location.search)
const satker = params.get('satker') || ''   // nama tab (mis. "Aceh")

const satkerLabelEl = document.getElementById('satkerLabel')
const tahunSelect    = document.getElementById('tahunSelect')
const semesterSelect = document.getElementById('semesterSelect')
const rowsEl         = document.getElementById('rows')
const submitBtn      = document.getElementById('submitBtn')

satkerLabelEl.textContent = satker

let targetRows = []   // [{ row, values, fokus, tahun }]

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

function fmt(v) {
  if (v === '' || v == null) return '-'
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toLocaleString('id-ID')
}

function currentRows() {
  const y = Number(tahunSelect.value)
  return targetRows.filter(r => r.tahun === y)
}

// Tampilan saat target belum diinput: pesan + tombol ke Input Target
function showNoTarget() {
  const controls = document.getElementById('controlsBar')
  const submitBar = document.getElementById('submitBar')
  if (controls) controls.style.display = 'none'
  if (submitBar) submitBar.style.display = 'none'
  rowsEl.innerHTML =
    '<div class="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center px-8" style="min-height:62vh;">' +
      '<div style="width:64px;height:64px;border-radius:18px;background:#fef3c7;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">' +
        '<svg width="30" height="30" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>' +
      '</div>' +
      '<h3 class="text-slate-800 font-semibold text-base mb-1">Data Target Belum Diinput</h3>' +
      '<p class="text-slate-500 text-sm mb-5">Realisasi hanya bisa diisi setelah target ditetapkan terlebih dahulu.</p>' +
      '<a href="input-target.html?satker=' + encodeURIComponent(satker) + (params.get('back') ? '&back=' + encodeURIComponent(params.get('back')) : '') + '" ' +
        'style="display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:11px 22px;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;">' +
        '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h7l1 2h6l-3 4 3 4h-6l-1-2H5a2 2 0 00-2 2z"/></svg>' +
        'Input Data Target' +
      '</a>' +
    '</div>'
}

function renderRows() {
  const sem = semesterSelect.value
  const rows = currentRows()
  if (!rows.length) {
    rowsEl.innerHTML = '<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Tidak ada target untuk tahun ini.</div>'
    return
  }
  rowsEl.innerHTML = rows.map(r => {
    const out  = sem === 'I' ? r.values[COL.REAL1_OUTPUT - 1]  : r.values[COL.REAL2_OUTPUT - 1]
    const ang  = sem === 'I' ? r.values[COL.REAL1_ANGGARAN - 1] : r.values[COL.REAL2_ANGGARAN - 1]
    const hamb = r.values[COL.HAMBATAN - 1] || ''
    const pend = r.values[COL.PENDUKUNG - 1] || ''
    return `
      <div data-row="${r.row}" class="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 class="text-slate-800 font-semibold text-sm mb-1">${escapeHtml(r.fokus)}</h3>
        <p class="text-xs text-slate-500 mb-4">Target: <b class="text-slate-700">${fmt(r.values[COL.TARGET_OUTPUT - 1])}</b> output · <b class="text-slate-700">Rp ${fmt(r.values[COL.TARGET_ANGGARAN - 1])}</b></p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Realisasi Output</label>
            <input type="number" min="0" data-f="output" value="${escapeHtml(out)}" placeholder="0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Realisasi Anggaran (Rp)</label>
            <input type="text" inputmode="numeric" data-f="anggaran" value="${escapeHtml(formatRupiah(ang))}" placeholder="0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Hambatan</label>
            <textarea data-f="hambatan" rows="4" placeholder="-"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 resize-none">${escapeHtml(hamb)}</textarea>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Pendukung</label>
            <textarea data-f="pendukung" rows="4" placeholder="-"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 resize-none">${escapeHtml(pend)}</textarea>
          </div>
        </div>
      </div>
    `
  }).join('')
  rowsEl.querySelectorAll('input[data-f="anggaran"]').forEach(attachRupiah)
}

tahunSelect.addEventListener('change', renderRows)
semesterSelect.addEventListener('change', renderRows)

async function init() {
  // Nama satker dari A1
  appsScriptRequest({ action: 'info', sheet: satker }).then((res) => {
    if (res && res.ok && res.satker) {
      satkerLabelEl.textContent = res.satker + (res.satker !== satker ? ` (${satker})` : '')
    }
  })

  showInputLoading('Memuat data target…')
  const res = await appsScriptRequest({ action: 'list', sheet: satker })
  hideInputLoading()
  if (!res || !res.ok || !Array.isArray(res.rows)) {
    showResultDialog(false, 'Gagal memuat data: ' + ((res && res.error) || 'tidak diketahui'), inputGoBack)
    return
  }

  targetRows = res.rows
    .map(r => ({
      row: r.row,
      values: r.values,
      fokus: String(r.values[COL.FOKUS - 1] || '').trim(),
      tahun: Number(r.values[COL.TAHUN - 1]),
    }))
    .filter(r => r.fokus !== '' && r.tahun >= 2000)

  if (!targetRows.length) {
    showNoTarget()
    return
  }

  const years = [...new Set(targetRows.map(r => r.tahun))].sort()
  tahunSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('')
  if (years.includes(TAHUN_BERJALAN)) tahunSelect.value = String(TAHUN_BERJALAN)

  setStatus('', '')
  renderRows()
}

submitBtn.addEventListener('click', async () => {
  const sem = semesterSelect.value
  const updates = []

  rowsEl.querySelectorAll('[data-row]').forEach(card => {
    const row  = Number(card.getAttribute('data-row'))
    const out  = card.querySelector('[data-f="output"]').value.trim()
    const ang  = card.querySelector('[data-f="anggaran"]').value.trim()
    const hamb = card.querySelector('[data-f="hambatan"]').value.trim()
    const pend = card.querySelector('[data-f="pendukung"]').value.trim()

    if (out === '' && ang === '' && hamb === '' && pend === '') return // lewati card kosong

    const cols = {}
    if (sem === 'I') {
      cols[COL.REAL1_OUTPUT]   = out === '' ? '' : Number(out)
      cols[COL.REAL1_ANGGARAN] = parseRupiah(ang)
    } else {
      cols[COL.REAL2_OUTPUT]   = out === '' ? '' : Number(out)
      cols[COL.REAL2_ANGGARAN] = parseRupiah(ang)
    }
    cols[COL.HAMBATAN]  = hamb
    cols[COL.PENDUKUNG] = pend
    updates.push({ row, cols })
  })

  if (!updates.length) { setStatus('Isi minimal satu realisasi.', 'error'); return }

  submitBtn.disabled = true
  showInputLoading('Menyimpan…')

  const res = await appsScriptRequest({ action: 'updateMany', sheet: satker, updates })
  hideInputLoading()

  if (res && res.ok) {
    showResultDialog(true, `Realisasi Semester ${sem} berhasil disimpan (${res.updated} fokus).`, inputGoBack)
  } else {
    submitBtn.disabled = false
    showResultDialog(false, 'Gagal menyimpan: ' + ((res && res.error) || 'tidak diketahui'), null)
  }
})

init()

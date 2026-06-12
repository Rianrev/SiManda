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

function toNum(v) {
  const n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? 0 : n
}

// URL http(s) yang wajar: host mengandung titik, tanpa spasi (sama dengan validasi server)
function validLink(s) {
  return /^https?:\/\/[^\s\/]+\.[^\s\/]{2,}(\/\S*)?$/i.test(s)
}

// Baris "Tercapai: X / Y" (akumulasi Sem I + Sem II), update live
function updateCardProgress(card) {
  const tOut = Number(card.dataset.tout) || 0
  const tAng = Number(card.dataset.tang) || 0
  const oOut = Number(card.dataset.oout) || 0
  const oAng = Number(card.dataset.oang) || 0
  const thisOut = toNum(card.querySelector('[data-f="output"]').value)
  const thisAng = parseRupiah(card.querySelector('[data-f="anggaran"]').value) || 0
  const totOut = oOut + thisOut
  const totAng = oAng + thisAng
  const pct = tOut > 0 ? Math.round((totOut / tOut) * 100) : 0
  const done = tOut > 0 && totOut >= tOut
  const p = card.querySelector('[data-progress]')
  if (!p) return
  p.innerHTML =
    `<span style="color:${done ? '#16a34a' : '#64748b'};">Tercapai: <b>${fmt(totOut)} / ${fmt(tOut)}</b> output (${pct}%)` +
    ` · <b>Rp ${fmt(totAng)} / Rp ${fmt(tAng)}</b></span>` +
    (done ? ' <b style="color:#16a34a;">✓</b>' : '')
}

function renderRows() {
  const sem = semesterSelect.value
  const rows = currentRows()
  if (!rows.length) {
    rowsEl.innerHTML = '<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Tidak ada target untuk tahun ini.</div>'
    return
  }
  rowsEl.innerHTML = rows.map(r => {
    const out  = sem === 'I' ? r.values[COL.REAL1_OUTPUT - 1]   : r.values[COL.REAL2_OUTPUT - 1]
    const ang  = sem === 'I' ? r.values[COL.REAL1_ANGGARAN - 1] : r.values[COL.REAL2_ANGGARAN - 1]
    const hamb = (sem === 'I' ? r.values[COL.HAMBATAN1 - 1]   : r.values[COL.HAMBATAN2 - 1])   || ''
    const pend = (sem === 'I' ? r.values[COL.PENDUKUNG1 - 1]  : r.values[COL.PENDUKUNG2 - 1])  || ''
    const dd   = (sem === 'I' ? r.values[COL.DATADUKUNG1 - 1] : r.values[COL.DATADUKUNG2 - 1]) || ''

    const tOut = toNum(r.values[COL.TARGET_OUTPUT - 1])
    const tAng = toNum(r.values[COL.TARGET_ANGGARAN - 1])
    const semIOut  = toNum(r.values[COL.REAL1_OUTPUT - 1])
    const otherOut = toNum(sem === 'I' ? r.values[COL.REAL2_OUTPUT - 1]   : r.values[COL.REAL1_OUTPUT - 1])
    const otherAng = toNum(sem === 'I' ? r.values[COL.REAL2_ANGGARAN - 1] : r.values[COL.REAL1_ANGGARAN - 1])

    // Sem II dikunci bila target sudah tercapai di Sem I
    const locked = sem === 'II' && tOut > 0 && semIOut >= tOut
    const dis = locked ? 'disabled' : ''
    const inputCls = locked ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'text-slate-800'
    const lockNote = locked
      ? '<div style="display:flex;align-items:center;gap:6px;background:#dcfce7;border:1px solid #bbf7d0;color:#15803d;font-size:12px;border-radius:8px;padding:8px 10px;margin-bottom:12px;">✓ Target sudah tercapai di Semester I.</div>'
      : ''

    return `
      <div data-row="${r.row}" data-fokus="${escapeHtml(r.fokus)}"${locked ? ' data-locked="1"' : ''} data-tout="${tOut}" data-tang="${tAng}" data-oout="${otherOut}" data-oang="${otherAng}" class="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 class="text-slate-800 font-semibold text-sm mb-1">${escapeHtml(r.fokus)}</h3>
        <p class="text-xs text-slate-500 mb-1">Target: <b class="text-slate-700">${fmt(tOut)}</b> output · <b class="text-slate-700">Rp ${fmt(tAng)}</b></p>
        <p data-progress class="text-xs mb-3"></p>
        ${lockNote}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Realisasi Output</label>
            <input type="number" min="0" data-f="output" ${dis} value="${escapeHtml(out)}" placeholder="0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${inputCls} focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Realisasi Anggaran (Rp)</label>
            <input type="text" inputmode="numeric" data-f="anggaran" ${dis} value="${escapeHtml(formatRupiah(ang))}" placeholder="0"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${inputCls} focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Hambatan</label>
            <textarea data-f="hambatan" rows="4" ${dis} placeholder="-"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${inputCls} focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 resize-none">${escapeHtml(hamb)}</textarea>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Pendukung</label>
            <textarea data-f="pendukung" rows="4" ${dis} placeholder="-"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${inputCls} focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 resize-none">${escapeHtml(pend)}</textarea>
          </div>
        </div>
        <div class="mt-3">
          <label class="block text-xs text-slate-500 mb-1">Link Data Dukung</label>
          <input type="url" data-f="datadukung" ${dis} value="${escapeHtml(dd)}" placeholder="https://drive.google.com/…"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${inputCls} focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40">
        </div>
      </div>
    `
  }).join('')
  rowsEl.querySelectorAll('input[data-f="anggaran"]:not([disabled])').forEach(attachRupiah)
  rowsEl.querySelectorAll('[data-row]').forEach(updateCardProgress)
}

tahunSelect.addEventListener('change', renderRows)
semesterSelect.addEventListener('change', renderRows)

// Update progress "Tercapai" secara live saat mengetik
rowsEl.addEventListener('input', e => {
  if (e.target.matches('[data-f="output"], [data-f="anggaran"]')) {
    const card = e.target.closest('[data-row]')
    if (card) updateCardProgress(card)
  }
  // Hapus tanda merah saat link diperbaiki
  if (e.target.matches('[data-f="datadukung"]')) {
    e.target.style.borderColor = ''
    e.target.style.boxShadow = ''
  }
})

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
  const tahun = Number(tahunSelect.value)

  // Server mencari baris via (fokus, tahun) — bukan nomor baris dari halaman ini,
  // yang bisa bergeser bila ada baris baru/terhapus sejak halaman dimuat.
  const items = []
  const invalidLinks = []
  rowsEl.querySelectorAll('[data-row]').forEach(card => {
    if (card.dataset.locked) return // Sem II terkunci (sudah tercapai di Sem I)
    const out  = card.querySelector('[data-f="output"]').value.trim()
    const ang  = card.querySelector('[data-f="anggaran"]').value.trim()
    const hamb = card.querySelector('[data-f="hambatan"]').value.trim()
    const pend = card.querySelector('[data-f="pendukung"]').value.trim()
    const ddEl = card.querySelector('[data-f="datadukung"]')
    let dd     = ddEl.value.trim()
    // Lengkapi skema agar link bisa dibuka dari dashboard (mis. "drive.google.com/…")
    if (dd && !/^https?:\/\//i.test(dd)) dd = 'https://' + dd

    // Link diisi tapi bukan URL → tandai merah, batalkan submit
    if (dd && !validLink(dd)) {
      ddEl.style.borderColor = '#ef4444'
      ddEl.style.boxShadow = '0 0 0 1px #ef4444'
      invalidLinks.push(card.getAttribute('data-fokus'))
      return
    }
    ddEl.style.borderColor = ''
    ddEl.style.boxShadow = ''

    if (out === '' && ang === '' && hamb === '' && pend === '' && dd === '') return // lewati card kosong

    items.push({
      fokus:      card.getAttribute('data-fokus'),
      output:     out === '' ? '' : Number(out),
      anggaran:   parseRupiah(ang),
      hambatan:   hamb,
      pendukung:  pend,
      dataDukung: dd,
    })
  })

  if (invalidLinks.length) {
    setStatus('Link Data Dukung tidak valid pada: ' + invalidLinks.join(', ') + '. Isi alamat lengkap (contoh: https://drive.google.com/...) atau kosongkan.', 'error')
    return
  }
  if (!items.length) { setStatus('Isi minimal satu realisasi.', 'error'); return }

  submitBtn.disabled = true
  showInputLoading('Menyimpan…')

  const res = await appsScriptRequest({ action: 'updateRealisasi', sheet: satker, tahun, semester: sem, items })
  hideInputLoading()

  if (res && res.ok) {
    showResultDialog(true, `Realisasi Semester ${sem} berhasil disimpan (${res.updated} fokus).`, inputGoBack)
  } else {
    submitBtn.disabled = false
    showResultDialog(false, 'Gagal menyimpan: ' + ((res && res.error) || 'tidak diketahui'), null)
  }
})

init()

// ============================================================
//  INPUT REALISASI — isi realisasi (output, anggaran, hambatan, pendukung,
//  link data dukung) per Fokus Prioritas, terpisah Semester I & II.
//  Baris targetnya sudah ada di sheet; di sini hanya mengisi kolom realisasi.
// ============================================================
const params = new URLSearchParams(window.location.search)
const satker = params.get('satker') || ''   // nama tab sheet (mis. "Aceh")

const labelSatker    = document.getElementById('satkerLabel')
const tahunSelect    = document.getElementById('tahunSelect')
const semesterSelect = document.getElementById('semesterSelect')
const wadahKartu     = document.getElementById('rows')
const submitBtn      = document.getElementById('submitBtn')

labelSatker.textContent = satker

let semuaTarget = []   // [{ row, values, fokus, tahun }] — semua baris target dari sheet

// ---- Helper kecil ----
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

// Format angka ke ribuan Indonesia; '-' bila kosong.
function fmt(v) {
  if (v === '' || v == null) return '-'
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toLocaleString('id-ID')
}

// Ambil angka dari teks apa pun (buang "Rp", titik, dll). Gagal → 0.
function toNum(v) {
  const n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? 0 : n
}

// URL http(s) yang wajar: host mengandung titik, tanpa spasi (sama dengan validasi server).
function validLink(s) {
  return /^https?:\/\/[^\s\/]+\.[^\s\/]{2,}(\/\S*)?$/i.test(s)
}

// Nomor kolom (1-based) untuk satu semester. Sem I = G..K, Sem II = L..P.
function kolomRealisasi(sem) {
  return sem === 'I'
    ? { output: COL.REAL1_OUTPUT, anggaran: COL.REAL1_ANGGARAN, hambatan: COL.HAMBATAN1, pendukung: COL.PENDUKUNG1, dataDukung: COL.DATADUKUNG1 }
    : { output: COL.REAL2_OUTPUT, anggaran: COL.REAL2_ANGGARAN, hambatan: COL.HAMBATAN2, pendukung: COL.PENDUKUNG2, dataDukung: COL.DATADUKUNG2 }
}

// Baris target untuk tahun yang sedang dipilih di dropdown.
function targetTahunIni() {
  const tahun = Number(tahunSelect.value)
  return semuaTarget.filter(t => t.tahun === tahun)
}

// ---- Tampilan saat target belum ada ----
function tampilkanBelumAdaTarget() {
  const controls = document.getElementById('controlsBar')
  const submitBar = document.getElementById('submitBar')
  if (controls) controls.style.display = 'none'
  if (submitBar) submitBar.style.display = 'none'
  const lanjutKeTarget = 'input-target.html?satker=' + encodeURIComponent(satker) +
    (params.get('back') ? '&back=' + encodeURIComponent(params.get('back')) : '')
  wadahKartu.innerHTML =
    '<div class="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center px-8" style="min-height:62vh;">' +
      '<div style="width:64px;height:64px;border-radius:18px;background:#fef3c7;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">' +
        '<svg width="30" height="30" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>' +
      '</div>' +
      '<h3 class="text-slate-800 font-semibold text-base mb-1">Data Target Belum Diinput</h3>' +
      '<p class="text-slate-500 text-sm mb-5">Realisasi hanya bisa diisi setelah target ditetapkan terlebih dahulu.</p>' +
      '<a href="' + lanjutKeTarget + '" ' +
        'style="display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:11px 22px;border-radius:12px;font-weight:600;font-size:14px;text-decoration:none;">' +
        '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h7l1 2h6l-3 4 3 4h-6l-1-2H5a2 2 0 00-2 2z"/></svg>' +
        'Input Data Target' +
      '</a>' +
    '</div>'
}

// ---- Baris "Tercapai: X / Y" (akumulasi Sem I + Sem II), update tiap user mengetik ----
function perbaruiProgress(kartu) {
  const targetOutput   = Number(kartu.dataset.tout) || 0
  const targetAnggaran = Number(kartu.dataset.tang) || 0
  const lainOutput     = Number(kartu.dataset.oout) || 0   // realisasi semester satunya
  const lainAnggaran   = Number(kartu.dataset.oang) || 0
  const isiOutput      = toNum(kartu.querySelector('[data-f="output"]').value)
  const isiAnggaran    = parseRupiah(kartu.querySelector('[data-f="anggaran"]').value) || 0

  const totalOutput   = lainOutput + isiOutput
  const totalAnggaran = lainAnggaran + isiAnggaran
  const persen   = targetOutput > 0 ? Math.round((totalOutput / targetOutput) * 100) : 0
  const tercapai = targetOutput > 0 && totalOutput >= targetOutput
  const lebihAnggaran = targetAnggaran > 0 && totalAnggaran > targetAnggaran // realisasi anggaran > 100% target

  kartu.dataset.overbudget = lebihAnggaran ? '1' : ''
  const inputAng = kartu.querySelector('[data-f="anggaran"]')
  if (inputAng) {
    inputAng.style.borderColor = lebihAnggaran ? '#ef4444' : ''
    inputAng.style.boxShadow   = lebihAnggaran ? '0 0 0 1px #ef4444' : ''
  }

  const baris = kartu.querySelector('[data-progress]')
  if (!baris) return
  const warna = lebihAnggaran ? '#dc2626' : (tercapai ? '#16a34a' : '#64748b')
  baris.innerHTML =
    `<span style="color:${warna};">Tercapai: <b>${fmt(totalOutput)} / ${fmt(targetOutput)}</b> output (${persen}%)` +
    ` · <b>Rp ${fmt(totalAnggaran)} / Rp ${fmt(targetAnggaran)}</b></span>` +
    (lebihAnggaran ? ' <b style="color:#dc2626;">✗</b>' : tercapai ? ' <b style="color:#16a34a;">✓</b>' : '') +
    (lebihAnggaran ? '<br><span style="color:#dc2626;font-weight:600;">⚠ Realisasi anggaran melebihi target (maks 100%).</span>' : '')
}

// ---- Satu kartu Fokus Prioritas ----
function kartuHtml(target, sem) {
  const kol     = kolomRealisasi(sem)
  const kolLain = kolomRealisasi(sem === 'I' ? 'II' : 'I')
  const v = target.values

  const output    = v[kol.output - 1]
  const anggaran  = v[kol.anggaran - 1]
  const hambatan  = v[kol.hambatan - 1]  || ''
  const pendukung = v[kol.pendukung - 1] || ''
  const dataDukung = v[kol.dataDukung - 1] || ''

  const targetOutput   = toNum(v[COL.TARGET_OUTPUT - 1])
  const targetAnggaran = toNum(v[COL.TARGET_ANGGARAN - 1])
  const lainOutput     = toNum(v[kolLain.output - 1])     // realisasi semester satunya (untuk akumulasi)
  const lainAnggaran   = toNum(v[kolLain.anggaran - 1])

  const kelasInput = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40'

  return `
    <div data-row="${target.row}" data-fokus="${escapeHtml(target.fokus)}" data-tout="${targetOutput}" data-tang="${targetAnggaran}" data-oout="${lainOutput}" data-oang="${lainAnggaran}" class="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 class="text-slate-800 font-semibold text-sm mb-1">${escapeHtml(target.fokus)}</h3>
      <p class="text-xs text-slate-500 mb-1">Target: <b class="text-slate-700">${fmt(targetOutput)}</b> output · <b class="text-slate-700">Rp ${fmt(targetAnggaran)}</b></p>
      <p data-progress class="text-xs mb-3"></p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-slate-500 mb-1">Realisasi Output</label>
          <input type="number" min="0" data-f="output" value="${escapeHtml(output)}" placeholder="0" class="${kelasInput}">
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Realisasi Anggaran (Rp)</label>
          <input type="text" inputmode="numeric" data-f="anggaran" value="${escapeHtml(formatRupiah(anggaran))}" placeholder="0" class="${kelasInput}">
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-slate-500 mb-1">Hambatan</label>
          <textarea data-f="hambatan" rows="4" placeholder="-" class="${kelasInput} resize-none">${escapeHtml(hambatan)}</textarea>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Pendukung</label>
          <textarea data-f="pendukung" rows="4" placeholder="-" class="${kelasInput} resize-none">${escapeHtml(pendukung)}</textarea>
        </div>
      </div>
      <div class="mt-3">
        <label class="block text-xs text-slate-500 mb-1">Link Data Dukung</label>
        <input type="url" data-f="datadukung" value="${escapeHtml(dataDukung)}" placeholder="https://drive.google.com/…" class="${kelasInput}">
      </div>
    </div>
  `
}

// ---- Render semua kartu untuk tahun + semester yang dipilih ----
function tampilkanKartu() {
  const sem = semesterSelect.value
  const daftar = targetTahunIni()
  if (!daftar.length) {
    wadahKartu.innerHTML = '<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Tidak ada target untuk tahun ini.</div>'
    return
  }
  wadahKartu.innerHTML = daftar.map(target => kartuHtml(target, sem)).join('')
  wadahKartu.querySelectorAll('input[data-f="anggaran"]').forEach(attachRupiah)
  wadahKartu.querySelectorAll('[data-row]').forEach(perbaruiProgress)
}

tahunSelect.addEventListener('change', tampilkanKartu)
semesterSelect.addEventListener('change', tampilkanKartu)

// Update progress live saat mengetik output/anggaran; hapus tanda merah link saat diperbaiki.
wadahKartu.addEventListener('input', e => {
  if (e.target.matches('[data-f="output"], [data-f="anggaran"]')) {
    const kartu = e.target.closest('[data-row]')
    if (kartu) perbaruiProgress(kartu)
  }
  if (e.target.matches('[data-f="datadukung"]')) {
    e.target.style.borderColor = ''
    e.target.style.boxShadow = ''
  }
})

// ---- Muat data target dari sheet ----
async function muatData() {
  // Nama resmi satker dari sel A1 (label header).
  appsScriptRequest({ action: 'info', sheet: satker }).then(res => {
    if (res && res.ok && res.satker) {
      labelSatker.textContent = res.satker + (res.satker !== satker ? ` (${satker})` : '')
    }
  })

  showInputLoading('Memuat data target…')
  const res = await appsScriptRequest({ action: 'list', sheet: satker })
  hideInputLoading()
  if (!res || !res.ok || !Array.isArray(res.rows)) {
    showResultDialog(false, 'Gagal memuat data: ' + ((res && res.error) || 'tidak diketahui'), inputGoBack)
    return
  }

  semuaTarget = res.rows
    .map(r => ({
      row: r.row,
      values: r.values,
      fokus: String(r.values[COL.FOKUS - 1] || '').trim(),
      tahun: Number(r.values[COL.TAHUN - 1]),
    }))
    .filter(t => t.fokus !== '' && t.tahun >= 2000)

  if (!semuaTarget.length) {
    tampilkanBelumAdaTarget()
    return
  }

  // Isi dropdown tahun dari tahun-tahun yang ada datanya; default ke tahun berjalan bila ada.
  const tahunTersedia = [...new Set(semuaTarget.map(t => t.tahun))].sort()
  tahunSelect.innerHTML = tahunTersedia.map(y => `<option value="${y}">${y}</option>`).join('')
  if (tahunTersedia.includes(TAHUN_BERJALAN)) tahunSelect.value = String(TAHUN_BERJALAN)

  setStatus('', '')
  tampilkanKartu()
}

// ---- Simpan realisasi ----
submitBtn.addEventListener('click', async () => {
  const sem = semesterSelect.value
  const tahun = Number(tahunSelect.value)

  // Server mencari baris via (fokus, tahun) — bukan nomor baris halaman ini,
  // yang bisa bergeser bila ada baris baru/terhapus sejak halaman dimuat.
  const items = []
  const linkTakValid = []
  const anggaranLebih = []

  wadahKartu.querySelectorAll('[data-row]').forEach(kartu => {
    if (kartu.dataset.overbudget === '1') { anggaranLebih.push(kartu.getAttribute('data-fokus')); return }

    const output    = kartu.querySelector('[data-f="output"]').value.trim()
    const anggaran   = kartu.querySelector('[data-f="anggaran"]').value.trim()
    const hambatan   = kartu.querySelector('[data-f="hambatan"]').value.trim()
    const pendukung  = kartu.querySelector('[data-f="pendukung"]').value.trim()
    const inputLink  = kartu.querySelector('[data-f="datadukung"]')
    let dataDukung   = inputLink.value.trim()
    if (dataDukung && !/^https?:\/\//i.test(dataDukung)) dataDukung = 'https://' + dataDukung // lengkapi skema

    // Link diisi tapi bukan URL → tandai merah, batalkan submit.
    if (dataDukung && !validLink(dataDukung)) {
      inputLink.style.borderColor = '#ef4444'
      inputLink.style.boxShadow = '0 0 0 1px #ef4444'
      linkTakValid.push(kartu.getAttribute('data-fokus'))
      return
    }
    inputLink.style.borderColor = ''
    inputLink.style.boxShadow = ''

    // Lewati kartu yang semua isinya kosong.
    if (output === '' && anggaran === '' && hambatan === '' && pendukung === '' && dataDukung === '') return

    items.push({
      fokus:      kartu.getAttribute('data-fokus'),
      output:     output === '' ? '' : Number(output),
      anggaran:   parseRupiah(anggaran),
      hambatan,
      pendukung,
      dataDukung,
    })
  })

  if (anggaranLebih.length) {
    setStatus('Realisasi anggaran melebihi target (maks 100%) pada: ' + anggaranLebih.join(', ') + '. Perbaiki sebelum menyimpan.', 'error')
    return
  }
  if (linkTakValid.length) {
    setStatus('Link Data Dukung tidak valid pada: ' + linkTakValid.join(', ') + '. Isi alamat lengkap (contoh: https://drive.google.com/...) atau kosongkan.', 'error')
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

muatData()

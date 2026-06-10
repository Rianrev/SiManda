// ============================================================
//  KONFIGURASI INPUT (Target & Realisasi)
//  Diisi setelah Apps Script di-deploy.
// ============================================================
const APPS_SCRIPT = {
  url:   'https://script.google.com/macros/s/AKfycbx3DjnBEGUJg45hW1xEoHty1FWB8Is_xiI0tFtZtiQ8LTNQHHRuh2Zqqz08kpkIJ9YO/exec',// GANTI: URL Web App Apps Script (hasil Deploy)
  token: '123789456', // harus SAMA dengan SECRET_TOKEN di Code.gs
}

const TAHUN_BERJALAN = new Date().getFullYear()  // hanya tahun berjalan

// Nama tab = nama provinsi (title di sidebar). Nilai kolom "Satker" = nama resmi.
// Lengkapi 33 satker lain nanti.
const SATKER_MAP = {
  'Aceh': 'BNNP Nanggroe Aceh Darussalam',
}

const FOKUS_PRIORITAS = [
  'Sosialisasi dan Diseminasi',
  'Integrasi Kurikulum Pendidikan Anti Narkoba di Sekolah, Madrasah dan Perguruan Tinggi',
  'Pelatihan Teknis Pendidik Sebaya Antinarkotika',
  'Fasilitasi Pemberdayaan Stakeholder Lembaga Pendidikan',
  'Fasilitasi Pemberdayaan Stakeholder Kelompok Masyarakat',
  'Fasilitasi Pemberdayaan Instansi',
  'Layanan Rehabilitasi',
]

// Posisi kolom (1-based) sesuai struktur sheet A..L (12 kolom).
// Realisasi Sem I & II kolom terpisah. Nama Satker diambil dari sel A1 (bukan SATKER_MAP).
const COL = {
  NO: 1, SATKER: 2, FOKUS: 3,
  TARGET_OUTPUT: 4, TARGET_ANGGARAN: 5, TAHUN: 6,
  REAL1_OUTPUT: 7, REAL1_ANGGARAN: 8,
  REAL2_OUTPUT: 9, REAL2_ANGGARAN: 10,
  HAMBATAN: 11, PENDUKUNG: 12,
}

// ---- Format Rupiah untuk input anggaran ----
// formatRupiah('5000000') -> '5.000.000' ; parseRupiah('5.000.000') -> 5000000
function formatRupiah(v) {
  const digits = String(v == null ? '' : v).replace(/[^\d]/g, '')
  return digits === '' ? '' : Number(digits).toLocaleString('id-ID')
}
function parseRupiah(v) {
  const digits = String(v == null ? '' : v).replace(/[^\d]/g, '')
  return digits === '' ? '' : Number(digits)
}
// Pasang auto-format saat user mengetik di input anggaran
function attachRupiah(input) {
  if (!input) return
  input.addEventListener('input', () => { input.value = formatRupiah(input.value) })
}

// Kembali ke dashboard satker (URL dari param ?back=), fallback history.back()
function inputGoBack() {
  const back = new URLSearchParams(window.location.search).get('back')
  if (back) window.location.href = decodeURIComponent(back)
  else history.back()
}

// ---- Loading overlay ----
function showInputLoading(msg) {
  let o = document.getElementById('inputLoading')
  if (o) { const t = o.querySelector('.il-msg'); if (t) t.textContent = msg || 'Memuat…'; return }
  o = document.createElement('div')
  o.id = 'inputLoading'
  o.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(5,12,22,0.55);backdrop-filter:blur(2px);font-family:Inter,sans-serif;'
  o.innerHTML =
    '<div style="width:44px;height:44px;border:4px solid rgba(255,255,255,0.25);border-top-color:#3b82f6;border-radius:50%;animation:ilspin 0.8s linear infinite;"></div>' +
    '<div class="il-msg" style="color:#e2e8f0;font-size:14px;"></div>' +
    '<style>@keyframes ilspin{to{transform:rotate(360deg)}}</style>'
  o.querySelector('.il-msg').textContent = msg || 'Memuat…'
  document.body.appendChild(o)
}

function hideInputLoading() {
  const o = document.getElementById('inputLoading')
  if (o) o.remove()
}

// ---- Dialog hasil (berhasil/gagal) dengan tombol OK ----
function showResultDialog(ok, message, onOk) {
  const old = document.getElementById('resultDialog'); if (old) old.remove()
  const overlay = document.createElement('div')
  overlay.id = 'resultDialog'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:rgba(5,12,22,0.6);backdrop-filter:blur(3px);font-family:Inter,sans-serif;'
  const color = ok ? '#22c55e' : '#ef4444'
  const bg    = ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
  const icon  = ok ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'
  overlay.innerHTML =
    '<div style="width:340px;max-width:90vw;background:#0f2744;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<svg width="30" height="30" fill="none" stroke="' + color + '" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="' + icon + '"/></svg>' +
      '</div>' +
      '<h3 style="color:#fff;font-size:17px;font-weight:600;margin:0 0 8px;">' + (ok ? 'Berhasil' : 'Gagal') + '</h3>' +
      '<p class="rd-msg" style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 22px;"></p>' +
      '<button id="resultOkBtn" style="width:100%;padding:11px;border:none;border-radius:10px;background:' + (ok ? '#2563eb' : '#475569') + ';color:#fff;font-size:14px;font-weight:600;cursor:pointer;">OK</button>' +
    '</div>'
  overlay.querySelector('.rd-msg').textContent = message || ''
  document.body.appendChild(overlay)
  overlay.querySelector('#resultOkBtn').addEventListener('click', () => {
    overlay.remove()
    if (typeof onOk === 'function') onOk()
  })
}

// Panggil Apps Script lewat main process (hindari CORS). Mengembalikan objek hasil.
async function appsScriptRequest(payload) {
  if (!APPS_SCRIPT.url) return { ok: false, error: 'APPS_SCRIPT.url belum diisi di input-config.js' }
  const body = Object.assign({ token: APPS_SCRIPT.token }, payload)
  if (window.electronAPI && window.electronAPI.appsScript) {
    return window.electronAPI.appsScript(APPS_SCRIPT.url, body)
  }
  // fallback (dev di browser biasa) — mungkin kena CORS
  try {
    const res = await fetch(APPS_SCRIPT.url, { method: 'POST', body: JSON.stringify(body) })
    return await res.json()
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

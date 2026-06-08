// ============================================================
//  KONFIGURASI INPUT (Target & Realisasi)
//  Diisi setelah Apps Script di-deploy.
// ============================================================
const APPS_SCRIPT = {
  url:   '',                      // GANTI: URL Web App Apps Script (hasil Deploy)
  token: 'GANTI_DENGAN_TOKEN_RAHASIA', // harus SAMA dengan SECRET_TOKEN di Code.gs
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

// Posisi kolom (1-based) sesuai struktur sheet A..K
const COL = {
  NO: 1, SATKER: 2, FOKUS: 3,
  TARGET_OUTPUT: 4, TARGET_ANGGARAN: 5, TAHUN: 6,
  REAL_OUTPUT: 7, REAL_ANGGARAN: 8, SEMESTER: 9,
  HAMBATAN: 10, PENDUKUNG: 11,
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

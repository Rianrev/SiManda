# SI MANDA — Project Context

> Dokumen ini ditujukan untuk AI/developer lain yang perlu memahami proyek dengan cepat.

## Ringkasan

**SI MANDA** (Sistem Informasi Monitoring Data) adalah aplikasi desktop **Electron** untuk **BNN RI** (Badan Narkotika Nasional Republik Indonesia). Tujuannya menampilkan dan memonitor data kinerja satuan kerja (satker) BNN yang tersimpan sebagai **Google Sheets** — baik dalam bentuk dashboard ringkas maupun tampilan spreadsheet penuh.

- **Stack**: Electron 30, HTML + TailwindCSS (CDN), Chart.js (lokal di `src/assets/vendor`), vanilla JS
- **Packager**: Electron Forge 7 (squirrel / zip / deb / rpm)
- **Bahasa UI**: Indonesia
- **Data source**: Google Sheets publik (via URL `docs.google.com/spreadsheets/...`)

## Struktur Folder

```
app/
├── main.js              # Entry point Electron (main process)
├── preload.js           # Preload script (versi chrome/node/electron)
├── menumaker.js         # Application menu (File/View/Window)
├── forge.config.js      # Konfigurasi Electron Forge + Fuses
├── package.json
├── src/
│   ├── index.html       # Halaman beranda (landing)
│   ├── sidebar.html     # Sidebar nav (di-fetch & disuntikkan ke halaman)
│   ├── web-view.html    # Menampilkan Google Sheet via <webview>
│   ├── dashboard.html   # Dashboard analitik (parse CSV dari Sheet)
│   └── assets/
│       ├── img/         # Logo, background (Picture3.png, logo1.png, dll)
│       └── vendor/chart.js/chart.umd.js
├── build/               # Ikon build (.ico)
└── release-builds/      # Output build
```

## Arsitektur Singkat

### Main process (`main.js`)
- Membuat `BrowserWindow` 1280×720 dengan `webviewTag: true` (diperlukan untuk embed Google Sheet).
- Memasang **Content-Security-Policy** via `session.defaultSession.webRequest.onHeadersReceived`:
  - `script-src` mengizinkan `https://cdn.tailwindcss.com`
  - `connect-src` mengizinkan `docs.google.com` + `*.googleusercontent.com`
  - `frame-src` mengizinkan `docs.google.com` + `accounts.google.com`
- Memasang menu dari `menumaker.js`.

### Renderer (halaman HTML di `src/`)
Tidak ada bundler. Setiap HTML:
1. Load Tailwind via CDN (`cdn.tailwindcss.com`) — menyuntikkan konfigurasi warna `navy.700/800/900/950`.
2. `fetch('sidebar.html')` lalu inject ke `<aside id="sidebar">`.
3. Tombol `#toggleBtn` untuk buka/tutup sidebar (toggle class `-translate-x-full` dan `ml-64`).

### Navigasi antar halaman
Semua link di sidebar memakai query string:
- `web-view.html?param1=<URL_SHEET>&title=<JUDUL>` — buka Sheet di dalam `<webview>`.
- `dashboard.html?sheetId=<ID>&title=<JUDUL>&sheetUrl=<URL>` — tampilkan dashboard ringkas.

Sidebar dikelompokkan: **Mabes**, **WIB**, **WITA**, **WIT** (zona waktu Indonesia), berisi daftar satker (Settama, Ittama, Deputi-deputi, 38 provinsi, dll). Saat ini hanya **Papua Barat** yang diarahkan ke `dashboard.html`; sisanya langsung ke `web-view.html`.

## Halaman

### `index.html` — Beranda
Landing page dengan background `Picture3.png` dan hint "Pilih menu di sidebar".

### `web-view.html` — Viewer Google Sheet
- Memvalidasi `param1` harus `hostname === 'docs.google.com'` dan path diawali `/spreadsheets/`.
- Menampilkan `<webview src=url>` dengan event `did-finish-load` / `did-fail-load` untuk loading & error state.

### `dashboard.html` — Dashboard Analitik
- Fetch CSV export: `https://docs.google.com/spreadsheets/d/<sheetId>/export?format=csv`
- Parse CSV sederhana (mendukung quoted fields).
- Heuristik ekstraksi data:
  - Cari baris yang mulai dengan angka atau huruf A–C (dianggap baris kasus).
  - Cari nama satker di baris awal (mengandung "bnn"/"bnnp").
  - Cari "Fokus Prioritas" di cell yang mengandung "layanan"/"asesmen".
  - Hitung kelengkapan berkas dari kolom ≥ 7: `√` / `v` / `✓` = lengkap, `X` / `x` = tidak lengkap.
- Render:
  - 4 metric cards (Satker, Total Kasus, Lengkap, Tidak Lengkap)
  - Banner Fokus Prioritas
  - Doughnut chart status berkas (Chart.js)
  - Tabel detail kasus
  - Bar chart Target vs Realisasi (opsional, muncul jika ada angka di kolom 4–7)
- Tombol "Edit Google Sheet" mengarahkan ke `web-view.html`.

## Konvensi Styling

- Tema navy konsisten: header `bg-navy-800`, sidebar `bg-navy-900`.
- Sidebar: `w-64`, `fixed`, scroll custom tipis (`.scrollbar-thin`).
- Main content: offset `ml-64 mt-14` (sidebar 256px, header 56px).
- Warna status: emerald untuk lengkap/positif, red untuk tidak lengkap/error.

## Menjalankan

```bash
npm install
npm start        # atau: npm run dev
npm run package  # package tanpa installer
npm run make     # build installer sesuai platform
```

## Catatan Penting untuk Pengembangan

1. **Tidak ada build step untuk CSS/JS** — edit HTML langsung terefleksi. Tailwind via CDN (bukan build lokal, walaupun `tailwindcss` terdaftar di devDependencies — belum dipakai).
2. **`webviewTag: true`** wajib untuk `web-view.html`. Jangan dihapus.
3. **CSP di `main.js`** harus ikut di-update bila menambah domain/CDN baru.
4. **Sheet ID vs URL**: `dashboard.html` butuh `sheetId` murni (untuk `.../export?format=csv`); `web-view.html` butuh URL penuh.
5. **Daftar satker di `sidebar.html`** di-hardcode. Untuk menambah satker/mengganti link, edit langsung file ini (pola: `<li><a href="web-view.html?param1=...&title=...">...</a></li>`).
6. **Heuristik parsing dashboard** bergantung pada struktur sheet tertentu (kolom 0 = nomor, kolom 3 = nama kasus, kolom 6 = keputusan TAT, kolom ≥ 7 = checklist berkas). Perubahan layout Sheet akan memecah dashboard.
7. **Electron Fuses**: `RunAsNode` & `NodeOptions` dimatikan; `OnlyLoadAppFromAsar` aktif. Jangan nyalakan untuk bypass tanpa alasan keamanan yang jelas.
8. **Preload.js** saat ini hanya dipakai untuk menampilkan versi runtime — tidak ada IPC handler. Aman untuk ditambahkan bila perlu.

## Potensi Peningkatan (belum dikerjakan)

- README.md masih placeholder (`# app`).
- Tidak ada test.
- Sidebar bisa di-generate dari data JSON (saat ini ratusan baris HTML manual).
- Tailwind sebaiknya di-build lokal (sudah terdaftar) untuk menghilangkan dependensi CDN & warning production.
- Dashboard hanya aktif untuk Papua Barat — bisa digeneralisasi untuk semua satker.

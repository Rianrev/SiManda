# SI MANDA — Project Context

> Dokumen ini ditujukan untuk AI/developer lain yang perlu memahami proyek dengan cepat.

## Ringkasan

**SI MANDA** (Sistem Informasi Monitoring Data) adalah aplikasi desktop **Electron** untuk **BNN RI** (Badan Narkotika Nasional Republik Indonesia). Tujuannya menampilkan dan memonitor data kinerja satuan kerja (satker) BNN yang tersimpan sebagai **Google Sheets** — baik dalam bentuk dashboard ringkas maupun tampilan spreadsheet penuh.

- **Stack**: Electron 30, HTML + TailwindCSS (build lokal di `src/assets/css/tailwind.min.css`), Chart.js (lokal di `src/assets/vendor`), vanilla JS
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
│   ├── index.html             # Halaman beranda (animasi tech, landing)
│   ├── login.html             # Halaman login
│   ├── sidebar.html           # Sidebar nav (di-fetch & disuntikkan ke halaman)
│   ├── web-view.html          # Menampilkan Google Sheet via <webview>
│   ├── dashboard-ananda.html  # Dashboard analitik (parse CSV dari Sheet)
│   ├── auth.js                # Autentikasi: getSession, authLogin, authLogout, filterSidebar
│   ├── js/
│   │   ├── index.js           # Script untuk index.html
│   │   ├── login.js           # Script untuk login.html
│   │   ├── dashboard-ananda.js # Script untuk dashboard-ananda.html (~300 baris)
│   │   └── web-view.js        # Script untuk web-view.html
│   └── assets/
│       ├── css/
│       │   ├── tailwind.min.css   # Tailwind build lokal (dengan konfigurasi warna navy)
│       │   ├── index.css          # Animasi tech background untuk index.html
│       │   └── sidebar.css        # Style nav sidebar (nav-link, chevron, active state)
│       ├── img/                   # Logo, ikon (logo1.jpeg, logo1.ico, war-on-drugs.png)
│       └── vendor/chart.js/chart.umd.js
├── build/               # Ikon build (.ico)
└── release-builds/      # Output build
```

## Arsitektur Singkat

### Main process (`main.js`)
- Membuat `BrowserWindow` 1280×720 dengan `webviewTag: true` (diperlukan untuk embed Google Sheet).
- Memasang **Content-Security-Policy** via `session.defaultSession.webRequest.onHeadersReceived`:
  - `script-src` mengizinkan sumber lokal
  - `connect-src` mengizinkan `docs.google.com` + `*.googleusercontent.com`
  - `frame-src` mengizinkan `docs.google.com` + `accounts.google.com`
- Memasang menu dari `menumaker.js`.

### Autentikasi (`auth.js`)
Global functions yang tersedia di semua halaman:
- `getSession()` — membaca sesi dari `localStorage`, returns `null` jika belum login.
- `authLogin(username, password)` — memvalidasi kredensial, returns session object atau `null`.
- `authLogout()` — menghapus sesi dan redirect ke `login.html`.
- `filterSidebar()` — menyembunyikan link sidebar yang tidak sesuai dengan `session.region` pengguna (non-master hanya melihat satker mereka sendiri).

Session object: `{ region: string }` — region `'*'` berarti Master (akses semua).

Guard redirect di setiap halaman (kecuali login) ada di `<head>` sebagai inline script:
```html
<script src="auth.js"></script>
<script>if (!getSession()) window.location.replace('login.html');</script>
```

### Renderer (halaman HTML di `src/`)
Tidak ada bundler. Setiap HTML:
1. Load `auth.js` + inline guard redirect di `<head>`.
2. Load CSS via `<link>`: `sidebar.css` (semua halaman dengan sidebar), `index.css` (hanya index.html), `tailwind.min.css`.
3. Load JS via `<script src="js/...">` di bawah `</body>`.
4. Script halaman `fetch('sidebar.html')` lalu inject ke `<aside id="sidebar">`, kemudian panggil `filterSidebar()`.
5. Tombol `#toggleBtn` untuk buka/tutup sidebar (toggle class `-translate-x-full` dan `ml-64/ml-0`).

### Navigasi antar halaman
Semua link di sidebar memakai query string:
- `web-view.html?param1=<URL_SHEET>&title=<JUDUL>` — buka Sheet di dalam `<webview>`.
- `dashboard-ananda.html?sheetId=<ID>&title=<JUDUL>&sheetUrl=<URL>` — tampilkan dashboard ringkas.

Sidebar dikelompokkan: **WIB**, **WITA**, **WIT** (zona waktu Indonesia), berisi 34 provinsi. Semua satker mengarah ke `dashboard-ananda.html`.

## Halaman

### `login.html` — Login
- Validasi session; jika sudah login redirect ke `index.html`.
- Form username + password dengan toggle show/hide.
- Script di `js/login.js`.

### `index.html` — Beranda
- Animasi tech background: grid, scan line, particle float, rotating rings, logo float.
- Animasi CSS di `assets/css/index.css`; script di `js/index.js`.
- Sidebar dimuat via fetch.

### `web-view.html` — Viewer Google Sheet
- Memvalidasi `param1` harus `hostname === 'docs.google.com'` dan path diawali `/spreadsheets/`.
- Kontrol akses regional: non-master hanya bisa melihat sheet yang `title` sesuai `session.region`.
- Menampilkan `<webview src=url>` dengan event `did-finish-load` / `did-fail-load`.
- Script di `js/web-view.js`.

### `dashboard-ananda.html` — Dashboard Analitik
- Fetch CSV export: `https://docs.google.com/spreadsheets/d/<sheetId>/export?format=csv`
- Parse CSV (mendukung quoted fields).
- Struktur data Sheet yang diharapkan: kolom 0 = nomor, kolom 1 = nama satker, kolom 2 = fokus prioritas, kolom 3 = target output, kolom 4 = satuan, kolom 5 = target anggaran, kolom 6 = realisasi output, kolom 8 = realisasi anggaran.
- Kontrol akses regional: non-master hanya bisa membuka dashboard yang `title` sesuai `session.region`.
- Render:
  - 4 metric cards (Total Satker, Target Output, Anggaran Total, Rata-rata Realisasi %)
  - Bar chart perbandingan output satker (Chart.js)
  - Bar chart perbandingan anggaran satker (Chart.js)
  - Tabel detail per satker dengan grouping fokus prioritas dan zebra striping
  - Filter satker (dropdown) + filter fokus prioritas (dropdown)
- Tombol "Lihat Google Sheet" mengarahkan ke `web-view.html`.
- Script di `js/dashboard-ananda.js`.

### `sidebar.html` — Navigasi Sidebar
- Fragment HTML murni (tidak ada `<html>`/`<head>`), di-load via `fetch` ke semua halaman.
- Tidak berisi `<style>` — CSS-nya ada di `assets/css/sidebar.css`.
- Accordion: WIB (18 provinsi), WITA (12 provinsi), WIT (4 provinsi).

## Konvensi Styling

- Tema navy konsisten: header `bg-navy-800`, sidebar `bg-navy-900`.
- Sidebar: `w-64`, `fixed`, scroll custom tipis (`.scrollbar-thin`).
- Main content: offset `ml-64 mt-14` (sidebar 256px, header 56px).
- Warna status: emerald/green untuk positif, red untuk error.
- Font: Inter + Manrope (Google Fonts, di `dashboard-ananda.html` dan `web-view.html`).

## Menjalankan

```bash
npm install
npm start        # atau: npm run dev
npm run package  # package tanpa installer
npm run make     # build installer sesuai platform
```

## Catatan Penting untuk Pengembangan

1. **Tidak ada build step untuk JS** — edit file di `src/js/` langsung terefleksi. Tailwind sudah di-build lokal ke `tailwind.min.css`.
2. **`webviewTag: true`** wajib untuk `web-view.html`. Jangan dihapus dari `main.js`.
3. **CSP di `main.js`** harus ikut di-update bila menambah domain/CDN baru.
4. **Sheet ID vs URL**: `dashboard-ananda.html` butuh `sheetId` murni (untuk `.../export?format=csv`); `web-view.html` butuh URL penuh.
5. **Daftar satker di `sidebar.html`** di-hardcode. Untuk menambah satker, edit langsung file ini (pola link sudah ada).
6. **Heuristik parsing dashboard** bergantung pada struktur kolom sheet tertentu. Perubahan layout Sheet akan memecah parsing di `parseSatkerData()` di `js/dashboard-ananda.js`.
7. **Auth guard** harus tetap sebagai inline script di `<head>` (bukan external file) agar redirect terjadi sebelum render halaman. Jangan pindahkan ke `js/`.
8. **sidebar.css** harus di-link di semua halaman yang memuat sidebar (index, dashboard-ananda, web-view). Jika menambah halaman baru, pastikan link ini ada.
9. **Electron Fuses**: `RunAsNode` & `NodeOptions` dimatikan; `OnlyLoadAppFromAsar` aktif.
10. **Preload.js** saat ini hanya dipakai untuk menampilkan versi runtime — tidak ada IPC handler.

## Potensi Peningkatan (belum dikerjakan)

- Tidak ada test.
- Sidebar bisa di-generate dari data JSON (saat ini ratusan baris HTML manual).
- Shared sidebar logic (`initSidebarAccordion`, `activateSidebarLink`) duplikat di beberapa JS — bisa dipindah ke satu file `js/sidebar.js` yang di-load bersama.
- Tidak ada offline fallback untuk fetch CSV dari Google Sheets.

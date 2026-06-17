# SI MANDA — Project Context

> Dokumen handoff untuk AI/developer lain yang perlu memahami proyek dengan cepat.
> Terakhir diperbarui: Juni 2026, branch `test-fitur` (versi 1.1.0).

## Ringkasan

**SI MANDA** (Sistem Informasi Monitoring Data) adalah aplikasi desktop **Electron** untuk **BNN RI**. Fungsinya: memantau data kinerja satuan kerja (satker/provinsi) BNN — input **Target** & **Realisasi** per Fokus Prioritas, lalu menampilkannya sebagai dashboard. Data tersimpan di **Google Sheets**, diakses lewat backend **Google Apps Script** (bukan CSV publik lagi).

- **Stack**: Electron 30, HTML + TailwindCSS v4 (build lokal `src/assets/css/tailwind.min.css`), Chart.js (lokal di `src/assets/vendor`), vanilla JS (tanpa bundler).
- **Backend**: Google Apps Script Web App (`apps-script/Code.gs`) + dua Google Spreadsheet (data satker & kredensial — TERPISAH).
- **Build/Release**: electron-builder (NSIS installer) via `scripts/build-dist.js`; auto-update via `electron-updater` + GitHub Releases.
- **Bahasa UI**: Indonesia.

## Remote Git (PENTING)

- `origin` → **GitLab** `kawirian108-group/SiManda` — repositori kode utama.
- `github` → **GitHub** `Rianrev/SiManda` — khusus Release/auto-updater. Aset release dinamai berstrip (`SI-MANDA-Setup-X.Y.Z.exe`) mengikuti `latest.yml`.
- Branch kerja: `test-fitur` (belum di-merge ke `master`). Token GitHub tersedia via `git credential fill`; `gh` CLI TIDAK terpasang — pakai GitHub REST API (curl/Invoke-RestMethod).

## Arsitektur

### Main process (`main.js`)
- `BrowserWindow` 1280×720, `webviewTag: true` (jangan dihapus — dipakai `web-view.html`).
- **IPC handlers** (penting, beda dari dok lama yang bilang "tidak ada IPC"):
  - `apps-script` (invoke) → proxy `fetch` POST ke Apps Script di main process (hindari CORS renderer), timeout 30 dtk.
  - `open-external` → buka URL `http(s)` di browser eksternal (`shell.openExternal`).
  - `get-app-version-sync`, `get-run-id-sync` → versi app & ID unik per run.
  - `get-update-status` / `restart-to-update` + event auto-updater (`update-available/progress/downloaded`).
- Auto-updater: cek cache lokal dulu (`checkCachedUpdate`) lalu GitHub. `autoInstallOnAppQuit=false` (install hanya saat user klik Restart).
- Catatan: saat ini TIDAK ada blok CSP `onHeadersReceived` (dok lama keliru menyebutnya).

### `preload.js`
Expose `window.electronAPI`: `appsScript(url, payload)`, `openExternal(url)`, `appVersion`, `runId`, dan fungsi updater. Inilah jembatan renderer → main.

### Backend Apps Script (`apps-script/Code.gs`)
File ini **template/referensi** — TIDAK ikut ter-bundle ke installer (whitelist `files` di package.json tidak menyertakan `apps-script/`). Yang berjalan adalah versi yang sudah di-deploy di editor Apps Script (dengan `SECRET_TOKEN` & `AUTH_SPREADSHEET_ID` asli; di repo masih placeholder).

- Endpoint POST JSON, semua butuh `token` = `SECRET_TOKEN`.
- Actions: `login`, `list`, `info`, `upsertTarget`, `updateRealisasi`, plus lawas `append`/`update`/`updateMany`.
- **Semua action yang menulis dibungkus `LockService`** (anti race saat input bersamaan).
- `upsertTarget`: server yang memutuskan update/append per `(fokus,tahun)` secara atomik → anti baris ganda.
- `updateRealisasi`: cari baris via `(fokus,tahun)` (bukan nomor baris client yang bisa bergeser); tulis 5 kolom blok semester sekaligus.
- Validasi server: `validTahun` (2020..tahun+1), `cleanNum` (≥0), `cleanText` (maks 2000), `cleanLink` (wajib URL http(s) wajar; '' boleh).
- `adminSetPassword()` — ganti password user dari editor Apps Script (re-hash + salt baru), tanpa deploy ulang.
- `seedAuthSheet()` — masih ada di repo sebagai referensi, tapi **sudah DIHAPUS dari Apps Script yang ter-deploy** (berbahaya: `sh.clear()` me-reset semua password). Jangan dijalankan lagi.

### Autentikasi (server-side)
- Kredensial di **spreadsheet TERPISAH** dari data (`AUTH_SPREADSHEET_ID`), tab `users`: `username | password_hash | salt | region | aktif`.
- Password di-**hash SHA-256 + salt unik per user** (`Utilities.computeDigest`), bukan plaintext, bukan reversible. Salt acak (`Utilities.getUuid`).
- `loginUser` di Code.gs verifikasi; kolom `aktif != Y` → akun nonaktif.
- Client ([src/auth.js](src/auth.js)): `authLogin()` async memanggil action `login`. `getSession()` membaca `localStorage`; sesi diikat ke `runId` → **wajib login tiap aplikasi dibuka**. `filterSidebar()` menyembunyikan satker non-region untuk user non-master (region `'*'` = Master). `login.html` memuat `js/input-config.js` lalu `auth.js`.
- Password saat ini masih `123456` (semua satker) / `MasterSimanda` (master). Migrasi ke password unik per satker DITUNDA atas keputusan user.

### Konfigurasi client (`src/js/input-config.js`)
- `APPS_SCRIPT.url` + `APPS_SCRIPT.token` (token `123789456` — ikut ter-bundle di `app.asar`, kandidat dirotasi).
- `TAHUN_BERJALAN = new Date().getFullYear()` (dinamis).
- `FOKUS_PRIORITAS` (7 item), `SATKER_MAP` (BARU berisi Aceh — 33 satker lain belum dilengkapi).
- `COL` (1-based, harus sama dengan `COLS` di Code.gs).

### Struktur kolom sheet data (A..P, 16 kolom)
```
1 No · 2 Satker · 3 Fokus · 4 TargetOutput · 5 TargetAnggaran · 6 Tahun
Sem I : 7 Real1Output · 8 Real1Anggaran · 9 Hambatan1 · 10 Pendukung1 · 11 DataDukung1
Sem II: 12 Real2Output · 13 Real2Anggaran · 14 Hambatan2 · 15 Pendukung2 · 16 DataDukung2
```
Nama satker diambil dari sel A1 tiap tab. Nama tab = `title` di link sidebar.

## Halaman (renderer, `src/`)

Pola tiap halaman: `<head>` memuat `auth.js` + inline guard `if(!getSession()) replace('login.html')`; sidebar di-`fetch('sidebar.html')` lalu inject ke `<aside id="sidebar">` + `filterSidebar()`; script halaman di bawah `</body>`.

- **`login.html`** — form login; submit async → `authLogin` (Apps Script). Pesan error membedakan kredensial salah vs gangguan jaringan.
- **`index.html`** — beranda (animasi tech background).
- **`dashboard-ananda.html`** + `js/dashboard-ananda.js` — dashboard satker:
  - Ambil data via Apps Script `action:'list'` pada tab `?title=<Satker>`; `parseRows` hanya pakai baris dengan Fokus terisi & Tahun ≥ 2000.
  - Filter **Tahun Anggaran** (data-driven, semua tahun berdata) + **Semester** (I/II).
  - Kartu metrik 2 baris: [Target Output, Realisasi Output] · [Target Anggaran, Realisasi Anggaran, % Realisasi Anggaran].
  - 2 bar chart (Output & Anggaran per Fokus: Target/Sem I/Sem II).
  - Tabel **Target & Realisasi** (kolom Data Dukung berisi tombol Sem I/Sem II → `openExternal`) + tabel **Hambatan & Pendukung** (judul ikut semester aktif).
  - Tombol Input → popup pilih Input Target / Input Realisasi.
- **`input-target.html`** + `js/input-target.js` — input target per Fokus. Dropdown tahun **terkunci ke tahun berjalan saja** (by design). Submit → `upsertTarget`.
- **`input-realisasi.html`** + `js/input-realisasi.js` — input realisasi per semester. Dropdown tahun **data-driven** (tahun-tahun yang punya target) → bisa input realisasi tahun lalu di tahun berjalan. Field: Output, Anggaran, Hambatan, Pendukung, **Link Data Dukung** (validasi URL client+server). Sem II TIDAK lagi dikunci walau target tercapai di Sem I. Submit → `updateRealisasi`.
- **`web-view.html`** + `js/web-view.js` — embed Google Sheet via `<webview>` (validasi host `docs.google.com`).
- **`sidebar.html`** — fragment nav; daftar satker hardcode (link `dashboard-ananda.html?...&title=<Satker>`). Ada menu **Survey** (`<a data-survey>`) → handler delegasi di `auth.js` buka Google Form via `openExternal` (`SURVEY_LINK`). Juga ada widget **TANIA** (FAB WhatsApp) di `auth.js`.

## Build & Release

```bash
npm start                              # dev (electron-forge start)
node scripts/build-dist.js --target installer   # build NSIS installer ke dist/
```
- `scripts/build-dist.js`: generate Tailwind + ikon, swap CDN→CSS lokal di HTML, jalankan electron-builder (NSIS), restore HTML.
- **Catatan Windows**: script npm `build:css` (`node_modules/.bin/tailwindcss ...`) gagal di PowerShell; jalankan via Git Bash `./node_modules/.bin/tailwindcss -i src/assets/css/input.css -o src/assets/css/tailwind.min.css --minify`.
- Setelah build: buat GitHub Release + upload `SI-MANDA-Setup-X.Y.Z.exe`, `.blockmap`, `latest.yml` (lihat `scripts/upload-release.ps1` sebagai acuan; token via git credential).
- **Dua sistem build koeksis**: electron-forge (devDeps + `forge.config.js`) dan electron-builder (`build` di package.json). Yang dipakai untuk release = electron-builder. Idealnya forge dipensiunkan (lihat peningkatan).

### Deploy backend (WAJIB tiap ubah Code.gs)
1. Salin `apps-script/Code.gs` ke editor Apps Script.
2. Isi `SECRET_TOKEN` (= `123789456`) & `AUTH_SPREADSHEET_ID` (ID spreadsheet kredensial).
3. Deploy → Manage deployments → edit → **New version** (URL web app tetap sama).

## Status Saat Ini / TODO

- **Belum di-commit**: tombol Survey (`src/auth.js` + `src/sidebar.html`) — pending keputusan/commit user.
- **Belum di-push**: commit `071cb7a` (unlock Sem II) menunggu di lokal (`origin/test-fitur`).
- Release GitHub kini hanya **v1.1.0** (1.0.0 & 1.0.1 dihapus; tag v1.0.0/v1.0.1 masih ada).

## Peningkatan yang disarankan (belum dikerjakan)

1. **Token sesi per-region di Apps Script** — `SECRET_TOKEN` global masih memberi akses tulis lintas satker.
2. **Whitelist URL** di handler IPC `apps-script` (`main.js`) — saat ini mem-fetch URL apa pun dari renderer.
3. **Lengkapi `SATKER_MAP`** — baru Aceh dari 34 satker.
4. **Migrasi password unik per satker** (generator siap dibuat).
5. **Hardening**: `sandbox:true`, blokir navigasi keluar; upgrade Electron 30 (EOL).
6. Konsolidasi build (pilih electron-builder, pensiunkan forge); tambah lint/test; footer "© 2026" hardcode bisa diotomatiskan.

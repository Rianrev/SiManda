/**
 * SI MANDA — Apps Script Web App backend (berbasis POSISI kolom).
 * Dipakai untuk Input Target (append) & Input Realisasi (update kolom).
 *
 * Deploy:
 *   1. Buka spreadsheet → Extensions → Apps Script
 *   2. Paste seluruh file ini, ganti SECRET_TOKEN
 *   3. Deploy → New deployment → Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy "Web app URL" → taruh di src/js/input-config.js (APPS_SCRIPT.url)
 *
 * Endpoint (POST JSON, atau GET query):
 *   { action:'list',   sheet, token }                                   → semua baris + nomor barisnya
 *   { action:'upsertTarget',    sheet, token, tahun, items:[{no,fokus,output,anggaran}] }
 *       → atomik: update baris (fokus,tahun) yang sudah ada, sisanya append. Anti baris ganda.
 *   { action:'updateRealisasi', sheet, token, tahun, semester:'I'|'II',
 *       items:[{fokus,output,anggaran,hambatan,pendukung,dataDukung}] }
 *       → cari baris via (fokus,tahun) — aman walau nomor baris bergeser.
 *   Lawas (masih didukung): append, update, updateMany — semua kini di dalam lock.
 *
 * Semua action yang menulis dibungkus LockService → input bersamaan dari
 * beberapa user diproses bergiliran, tidak saling menimpa/duplikat.
 *
 * Catatan: pakai posisi kolom (bukan nama header) karena header "Anggaran"
 * muncul lebih dari sekali. Kolom 1-based: 1=A, 2=B, dst.
 */

const SECRET_TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA';

// Spreadsheet kredensial (file TERPISAH dari data, jangan di-share ke siapa pun).
// Isi dengan ID dari URL: https://docs.google.com/spreadsheets/d/<ID>/edit
const AUTH_SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_AUTH';

// Posisi kolom (1-based) — HARUS sama dengan COL di src/js/input-config.js
// Blok per semester (5 kolom berurutan): Output, Anggaran, Hambatan, Pendukung, Link Data Dukung.
const COLS = {
  NO: 1, SATKER: 2, FOKUS: 3,
  TARGET_OUTPUT: 4, TARGET_ANGGARAN: 5, TAHUN: 6,
  REAL1_OUTPUT: 7,  REAL1_ANGGARAN: 8,  HAMBATAN1: 9,  PENDUKUNG1: 10, DATADUKUNG1: 11,
  REAL2_OUTPUT: 12, REAL2_ANGGARAN: 13, HAMBATAN2: 14, PENDUKUNG2: 15, DATADUKUNG2: 16,
};
const SHEET_COLS = 16;

function doGet(e)  { return handle((e && e.parameter) || {}); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}
  return handle(body);
}

function handle(p) {
  try {
    if (p.token !== SECRET_TOKEN) return json({ ok: false, error: 'Unauthorized' });

    // Login tidak butuh parameter "sheet" — cek kredensial di spreadsheet auth.
    if (p.action === 'login') return json(loginUser(p.username, p.password));

    if (!p.sheet) return json({ ok: false, error: 'Parameter "sheet" wajib' });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(p.sheet);
    if (!sheet) return json({ ok: false, error: 'Tab tidak ditemukan: ' + p.sheet });

    switch (p.action) {
      case 'info':       return json({ ok: true, satker: String(sheet.getRange('A1').getValue() || '') });
      case 'list':       return json(listRows(sheet));
      // Action yang MENULIS → bergiliran lewat lock (anti race saat input bersamaan)
      case 'upsertTarget':    return json(withLock(function () { return upsertTarget(sheet, p.tahun, p.items); }));
      case 'updateRealisasi': return json(withLock(function () { return updateRealisasi(sheet, p.tahun, p.semester, p.items); }));
      case 'append':          return json(withLock(function () { return appendRows(sheet, p.rows); }));
      case 'update':          return json(withLock(function () { return updateCols(sheet, p.row, p.cols); }));
      case 'updateMany':      return json(withLock(function () { return updateMany(sheet, p.updates); }));
      default:           return json({ ok: false, error: 'Action tidak dikenal: ' + p.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Serialisasi semua tulisan: request bersamaan antre, bukan saling menimpa.
function withLock(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return { ok: false, error: 'Server sedang memproses input lain. Tunggu sebentar lalu coba lagi.' };
  }
  try { return fn(); }
  finally { lock.releaseLock(); }
}

// ---- Validasi server-side ----
function validTahun(tahun) {
  var y = Number(tahun);
  var now = new Date().getFullYear();
  return y === Math.floor(y) && y >= 2020 && y <= now + 1;
}
// '' = sengaja dikosongkan; angka harus ≥ 0; selain itu → null (invalid)
function cleanNum(v) {
  if (v === '' || v == null) return '';
  var n = Number(v);
  return (isNaN(n) || n < 0) ? null : n;
}
function cleanText(v) { return String(v == null ? '' : v).slice(0, 2000); }

// Index baris yang ada: "fokus|tahun" → nomor baris (1-based)
function buildRowIndex(sheet) {
  var lastRow = sheet.getLastRow();
  var values = lastRow >= 1 ? sheet.getRange(1, 1, lastRow, SHEET_COLS).getValues() : [];
  var index = {};
  for (var r = 0; r < values.length; r++) {
    var f = String(values[r][COLS.FOKUS - 1] || '').trim();
    var y = Number(values[r][COLS.TAHUN - 1]);
    if (f && y) index[f + '|' + y] = r + 1;
  }
  return index;
}

/**
 * UPSERT TARGET — satu request atomik (di dalam lock):
 * baris (fokus,tahun) sudah ada → update kolom target; belum ada → append.
 * Menggantikan pola lama list→append/update di client yang bisa menghasilkan
 * baris ganda bila dua user submit bersamaan.
 */
function upsertTarget(sheet, tahun, items) {
  if (!validTahun(tahun)) return { ok: false, error: 'Tahun tidak valid: ' + tahun };
  if (!items || !items.length) return { ok: false, error: 'items kosong' };
  var tahunN = Number(tahun);

  // Validasi SEMUA item dulu — tolak seluruh request bila ada yang tidak valid
  var clean = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var fokus = String(it.fokus || '').trim();
    if (!fokus) return { ok: false, error: 'Fokus kosong pada item ke-' + (i + 1) };
    var out = cleanNum(it.output), ang = cleanNum(it.anggaran);
    if (out === null || ang === null) {
      return { ok: false, error: 'Output/Anggaran harus angka ≥ 0 ("' + fokus + '")' };
    }
    clean.push({ no: Number(it.no) || '', fokus: fokus, output: out, anggaran: ang });
  }

  var satker = String(sheet.getRange('A1').getValue() || '');
  var index = buildRowIndex(sheet);

  var appends = [], updated = 0;
  clean.forEach(function (it) {
    var rowNum = index[it.fokus + '|' + tahunN];
    if (rowNum) {
      sheet.getRange(rowNum, COLS.TARGET_OUTPUT, 1, 2).setValues([[it.output, it.anggaran]]);
      updated++;
    } else {
      var row = new Array(SHEET_COLS).fill('');
      row[COLS.NO - 1]              = it.no;
      row[COLS.SATKER - 1]          = satker;
      row[COLS.FOKUS - 1]           = it.fokus;
      row[COLS.TARGET_OUTPUT - 1]   = it.output;
      row[COLS.TARGET_ANGGARAN - 1] = it.anggaran;
      row[COLS.TAHUN - 1]           = tahunN;
      appends.push(row);
    }
  });
  if (appends.length) {
    // Satu setValues batch, bukan appendRow per baris → cepat & tidak interleave
    sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, SHEET_COLS).setValues(appends);
  }
  return { ok: true, added: appends.length, updated: updated };
}

/**
 * UPDATE REALISASI — cari baris via (fokus,tahun), BUKAN nomor baris dari client
 * (nomor baris bisa bergeser bila ada baris baru/terhapus sejak halaman dimuat).
 * Kolom semester berurutan (5): Sem I = G..K (7-11), Sem II = L..P (12-16).
 */
function updateRealisasi(sheet, tahun, semester, items) {
  if (!validTahun(tahun)) return { ok: false, error: 'Tahun tidak valid: ' + tahun };
  if (semester !== 'I' && semester !== 'II') return { ok: false, error: 'Semester harus "I" atau "II"' };
  if (!items || !items.length) return { ok: false, error: 'items kosong' };
  var tahunN = Number(tahun);
  var startCol = semester === 'I' ? COLS.REAL1_OUTPUT : COLS.REAL2_OUTPUT;

  var clean = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var fokus = String(it.fokus || '').trim();
    if (!fokus) return { ok: false, error: 'Fokus kosong pada item ke-' + (i + 1) };
    var out = cleanNum(it.output), ang = cleanNum(it.anggaran);
    if (out === null || ang === null) {
      return { ok: false, error: 'Output/Anggaran harus angka ≥ 0 ("' + fokus + '")' };
    }
    clean.push({ fokus: fokus, vals: [out, ang, cleanText(it.hambatan), cleanText(it.pendukung), cleanText(it.dataDukung)] });
  }

  var index = buildRowIndex(sheet);
  var notFound = [];
  clean.forEach(function (it) {
    if (!index[it.fokus + '|' + tahunN]) notFound.push(it.fokus);
  });
  if (notFound.length) {
    // Tolak seluruh request bila ada target yang hilang — jangan simpan separuh
    return { ok: false, error: 'Target tidak ditemukan untuk: ' + notFound.join(', ') + ' (tahun ' + tahunN + '). Muat ulang halaman lalu coba lagi.' };
  }

  var updated = 0;
  clean.forEach(function (it) {
    sheet.getRange(index[it.fokus + '|' + tahunN], startCol, 1, 5).setValues([it.vals]);
    updated++;
  });
  return { ok: true, updated: updated };
}

// ---- Action lawas (kompatibilitas mundur) ----
function appendRows(sheet, rows) {
  if (!rows || !rows.length) return { ok: false, error: 'rows kosong' };
  // Nama Satker = sel A1. Auto-isi kolom B (Satker) bila kosong.
  var satker = String(sheet.getRange('A1').getValue() || '');
  var matrix = rows.map(function (r) {
    var row = r.slice(0, SHEET_COLS);
    while (row.length < SHEET_COLS) row.push('');
    if (satker && (row[1] === '' || row[1] == null)) row[1] = satker;
    return row;
  });
  // Satu setValues batch, bukan appendRow per baris
  sheet.getRange(sheet.getLastRow() + 1, 1, matrix.length, SHEET_COLS).setValues(matrix);
  return { ok: true, added: matrix.length };
}

function listRows(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) return { ok: true, rows: [] };
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    out.push({ row: i + 1, values: values[i] });
  }
  return { ok: true, rows: out, lastRow: lastRow, lastCol: lastCol };
}

function updateCols(sheet, row, cols) {
  if (!row || !cols) return { ok: false, error: 'row/cols wajib' };
  Object.keys(cols).forEach(function (c) {
    sheet.getRange(Number(row), Number(c)).setValue(cols[c]);
  });
  return { ok: true, updated: row };
}

function updateMany(sheet, updates) {
  if (!updates || !updates.length) return { ok: false, error: 'updates kosong' };
  updates.forEach(function (u) {
    Object.keys(u.cols).forEach(function (c) {
      sheet.getRange(Number(u.row), Number(c)).setValue(u.cols[c]);
    });
  });
  return { ok: true, updated: updates.length };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  AUTH — kredensial di spreadsheet TERPISAH (AUTH_SPREADSHEET_ID)
//  Tab "users": username | password_hash | salt | region | aktif
// ============================================================

function loginUser(username, password) {
  if (!username || !password) return { ok: false, error: 'INVALID_CREDENTIALS' };
  var sh = SpreadsheetApp.openById(AUTH_SPREADSHEET_ID).getSheetByName('users');
  if (!sh) return { ok: false, error: 'Sheet "users" belum dibuat. Jalankan seedAuthSheet().' };

  var uname  = String(username).trim().toLowerCase();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) { // baris 1 = header
    var r = values[i];
    if (String(r[0]).trim().toLowerCase() !== uname) continue;
    if (String(r[4]).trim().toUpperCase() !== 'Y') return { ok: false, error: 'Akun dinonaktifkan. Hubungi admin.' };
    if (hashPassword(password, String(r[2])) !== String(r[1])) break; // password salah → jawaban generik
    return { ok: true, username: uname, region: String(r[3]) };
  }
  return { ok: false, error: 'INVALID_CREDENTIALS' };
}

function hashPassword(password, salt) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

/**
 * SEED — jalankan SEKALI secara manual dari editor Apps Script
 * (pilih fungsi "seedAuthSheet" → Run, lalu beri izin akses).
 * Membuat tab "users" di spreadsheet auth & mengisi 35 akun.
 * PERINGATAN: menimpa seluruh isi tab "users" bila sudah ada.
 */
function seedAuthSheet() {
  var ACCOUNTS = [
    // [username, password, region]
    ['bnnpaceh.4bnn',      '123456',        'Aceh'],
    ['bnnpsumut.7bnn',     '123456',        'Sumatera Utara'],
    ['bnnpsumbar.2bnn',    '123456',        'Sumatera Barat'],
    ['bnnpriau.9bnn',      '123456',        'Riau'],
    ['bnnpkepri.1bnn',     '123456',        'Kepulauan Riau'],
    ['bnnpjambi.5bnn',     '123456',        'Jambi'],
    ['bnnpsumsel.8bnn',    '123456',        'Sumatera Selatan'],
    ['bnnpbabel.3bnn',     '123456',        'Bangka Belitung'],
    ['bnnpbengkulu.6bnn',  '123456',        'Bengkulu'],
    ['bnnplampung.10bnn',  '123456',        'Lampung'],
    ['bnnpdki.2bnn',       '123456',        'DKI Jakarta'],
    ['bnnpbanten.7bnn',    '123456',        'Banten'],
    ['bnnpjabar.4bnn',     '123456',        'Jawa Barat'],
    ['bnnpjateng.9bnn',    '123456',        'Jawa Tengah'],
    ['bnnpdiy.1bnn',       '123456',        'DIY'],
    ['bnnpjatim.5bnn',     '123456',        'Jawa Timur'],
    ['bnnpbali.8bnn',      '123456',        'Bali'],
    ['bnnpntb.3bnn',       '123456',        'NTB'],
    ['bnnpntt.6bnn',       '123456',        'NTT'],
    ['bnnpkalbar.10bnn',   '123456',        'Kalimantan Barat'],
    ['bnnpkalteng.2bnn',   '123456',        'Kalimantan Tengah'],
    ['bnnpkalsel.7bnn',    '123456',        'Kalimantan Selatan'],
    ['bnnpkaltim.4bnn',    '123456',        'Kalimantan Timur'],
    ['bnnpkaltara.9bnn',   '123456',        'Kalimantan Utara'],
    ['bnnpsulut.1bnn',     '123456',        'Sulawesi Utara'],
    ['bnnpgorontalo.5bnn', '123456',        'Gorontalo'],
    ['bnnpsulteng.8bnn',   '123456',        'Sulawesi Tengah'],
    ['bnnpsulbar.3bnn',    '123456',        'Sulawesi Barat'],
    ['bnnpsulsel.6bnn',    '123456',        'Sulawesi Selatan'],
    ['bnnpsultra.10bnn',   '123456',        'Sulawesi Tenggara'],
    ['bnnpmaluku.2bnn',    '123456',        'Maluku'],
    ['bnnpmalut.7bnn',     '123456',        'Maluku Utara'],
    ['bnnppapua.4bnn',     '123456',        'Papua'],
    ['bnnppabar.9bnn',     '123456',        'Papua Barat'],
    ['master.1bnn',        'MasterSimanda', '*'],
  ];

  var ss = SpreadsheetApp.openById(AUTH_SPREADSHEET_ID);
  var sh = ss.getSheetByName('users') || ss.insertSheet('users');
  sh.clear();

  var rows = [['username', 'password_hash', 'salt', 'region', 'aktif']];
  ACCOUNTS.forEach(function (a) {
    var salt = Utilities.getUuid();
    rows.push([a[0], hashPassword(a[1], salt), salt, a[2], 'Y']);
  });
  sh.getRange(1, 1, rows.length, 5).setValues(rows);
  sh.setFrozenRows(1);
  Logger.log('Seed selesai: ' + ACCOUNTS.length + ' akun di tab "users".');
}

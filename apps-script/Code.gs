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
 *   { action:'append', sheet, token, rows:[[...kolom A..K...], ...] }   → tambah baris
 *   { action:'list',   sheet, token }                                   → semua baris + nomor barisnya
 *   { action:'update', sheet, token, row:<nomor baris 1-based>, cols:{ "7":val, "8":val } } → set sel
 *
 * Catatan: pakai posisi kolom (bukan nama header) karena header "Anggaran"
 * muncul lebih dari sekali. Kolom 1-based: 1=A, 2=B, dst.
 */

const SECRET_TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA';

// Spreadsheet kredensial (file TERPISAH dari data, jangan di-share ke siapa pun).
// Isi dengan ID dari URL: https://docs.google.com/spreadsheets/d/<ID>/edit
const AUTH_SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_AUTH';

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
      case 'append':     return json(appendRows(sheet, p.rows));
      case 'list':       return json(listRows(sheet));
      case 'update':     return json(updateCols(sheet, p.row, p.cols));
      case 'updateMany': return json(updateMany(sheet, p.updates));
      default:           return json({ ok: false, error: 'Action tidak dikenal: ' + p.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function appendRows(sheet, rows) {
  if (!rows || !rows.length) return { ok: false, error: 'rows kosong' };
  // Nama Satker = sel A1. Auto-isi kolom B (Satker) bila kosong.
  var satker = String(sheet.getRange('A1').getValue() || '');
  rows.forEach(function (r) {
    if (satker && (r[1] === '' || r[1] == null)) r[1] = satker;
    sheet.appendRow(r);
  });
  return { ok: true, added: rows.length };
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

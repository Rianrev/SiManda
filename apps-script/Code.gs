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

function doGet(e)  { return handle((e && e.parameter) || {}); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}
  return handle(body);
}

function handle(p) {
  try {
    if (p.token !== SECRET_TOKEN) return json({ ok: false, error: 'Unauthorized' });
    if (!p.sheet) return json({ ok: false, error: 'Parameter "sheet" wajib' });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(p.sheet);
    if (!sheet) return json({ ok: false, error: 'Tab tidak ditemukan: ' + p.sheet });

    switch (p.action) {
      case 'append': return json(appendRows(sheet, p.rows));
      case 'list':   return json(listRows(sheet));
      case 'update': return json(updateCols(sheet, p.row, p.cols));
      default:       return json({ ok: false, error: 'Action tidak dikenal: ' + p.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function appendRows(sheet, rows) {
  if (!rows || !rows.length) return { ok: false, error: 'rows kosong' };
  rows.forEach(function (r) { sheet.appendRow(r); });
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

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

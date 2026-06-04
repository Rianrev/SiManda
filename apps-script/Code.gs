/**
 * SI MANDA — Apps Script Web App backend untuk CRUD Google Sheets.
 *
 * Cara deploy:
 *   1. Buka Google Sheet target → menu Extensions → Apps Script
 *   2. Hapus isi default, paste seluruh file ini
 *   3. Ganti SECRET_TOKEN di bawah dengan string acak rahasia Anda
 *   4. Deploy → New deployment → type: Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   5. Copy "Web app URL" → berikan ke aplikasi (dipakai di sisi app)
 *
 * Endpoint:
 *   GET  ?action=list&sheet=NamaSheet&token=...           → semua baris (JSON)
 *   POST {action:'add',    sheet, token, row:{...}}        → tambah baris
 *   POST {action:'update', sheet, token, rowIndex, row}    → edit baris (rowIndex = nomor baris data, mulai 0)
 *   POST {action:'delete', sheet, token, rowIndex}         → hapus baris
 *
 * Baris pertama sheet dianggap HEADER. Object `row` dipetakan berdasarkan nama kolom header.
 */

const SECRET_TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA';

function doGet(e) {
  return handle(e, (e.parameter || {}));
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return handle(e, body);
}

function handle(e, params) {
  try {
    if (params.token !== SECRET_TOKEN) {
      return json({ ok: false, error: 'Unauthorized' });
    }

    const action = params.action;
    const sheetName = params.sheet;
    if (!sheetName) return json({ ok: false, error: 'Parameter "sheet" wajib' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return json({ ok: false, error: 'Sheet tidak ditemukan: ' + sheetName });

    switch (action) {
      case 'list':   return json({ ok: true, data: listRows(sheet) });
      case 'add':    return json(addRow(sheet, params.row));
      case 'update': return json(updateRow(sheet, params.rowIndex, params.row));
      case 'delete': return json(deleteRow(sheet, params.rowIndex));
      default:       return json({ ok: false, error: 'Action tidak dikenal: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function listRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const headers = getHeaders(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map((r, i) => {
    const obj = { _row: i }; // index baris data (0-based), dipakai untuk update/delete
    headers.forEach((h, c) => { obj[h] = r[c]; });
    return obj;
  });
}

function addRow(sheet, row) {
  if (!row) return { ok: false, error: 'Parameter "row" wajib' };
  const headers = getHeaders(sheet);
  const newRow = headers.map(h => (row[h] !== undefined ? row[h] : ''));
  sheet.appendRow(newRow);
  return { ok: true, message: 'Baris ditambahkan' };
}

function updateRow(sheet, rowIndex, row) {
  if (rowIndex === undefined || rowIndex === null) return { ok: false, error: 'rowIndex wajib' };
  if (!row) return { ok: false, error: 'Parameter "row" wajib' };
  const headers = getHeaders(sheet);
  const target = Number(rowIndex) + 2; // +2: lewati header & konversi ke 1-based
  const current = sheet.getRange(target, 1, 1, headers.length).getValues()[0];
  const merged = headers.map((h, c) => (row[h] !== undefined ? row[h] : current[c]));
  sheet.getRange(target, 1, 1, headers.length).setValues([merged]);
  return { ok: true, message: 'Baris diperbarui' };
}

function deleteRow(sheet, rowIndex) {
  if (rowIndex === undefined || rowIndex === null) return { ok: false, error: 'rowIndex wajib' };
  sheet.deleteRow(Number(rowIndex) + 2);
  return { ok: true, message: 'Baris dihapus' };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  SIDEBAR
// ============================================================
function initSidebarAccordion() {
  const all = document.querySelectorAll('#sidebar details');
  all.forEach(det => {
    det.addEventListener('toggle', () => {
      if (det.open) all.forEach(other => { if (other !== det) other.open = false; });
    });
  });
}

function activateSidebarLink() {
  const currentPage   = window.location.pathname.split('/').pop() || 'index.html';
  const currentParams = new URLSearchParams(window.location.search);
  let best = null;
  for (const a of document.querySelectorAll('#sidebar a')) {
    try {
      const u = new URL(a.href, window.location.href);
      if (u.pathname.split('/').pop() !== currentPage) continue;
      if (currentPage === 'dashboard-ananda.html') {
        if (u.searchParams.get('sheetId') === currentParams.get('sheetId')) { best = a; break; }
      } else if (currentPage === 'web-view.html') {
        if (u.searchParams.get('param1') === currentParams.get('param1')) { best = a; break; }
      } else { best = a; break; }
    } catch (_) {}
  }
  if (best) {
    best.classList.add('active');
    const det = best.closest('details');
    if (det) det.open = true;
  }
}

(() => {
  const toggleBtn = document.getElementById('toggleBtn');
  const sidebar   = document.getElementById('sidebar');
  const main      = document.getElementById('main');
  let open = true;
  toggleBtn.addEventListener('click', () => {
    open = !open;
    sidebar.classList.toggle('-translate-x-full', !open);
    main.classList.toggle('ml-64', open);
    main.classList.toggle('ml-0', !open);
  });
  fetch('sidebar.html').then(r => r.text()).then(html => {
    sidebar.innerHTML = html;
    filterSidebar();
    initSidebarAccordion();
    activateSidebarLink();
  });
})();

// ============================================================
//  SESSION & ACCESS CONTROL
// ============================================================
const _session = getSession();
document.getElementById('userBadge').textContent = _session.region === '*' ? 'Master' : _session.region;
(() => {
  const p = new URLSearchParams(window.location.search);
  const t = p.get('title') || '';
  if (_session.region !== '*' && t && t !== _session.region) window.location.replace('index.html');
})();

// ============================================================
//  DOM ELEMENT CACHE
// ============================================================
const el = {
  pageTitle:          document.getElementById('pageTitle'),
  breadcrumbTitle:    document.getElementById('breadcrumbTitle'),
  btnInput:           document.getElementById('btnInput'),
  tahunFilter:        document.getElementById('tahunFilter'),
  semesterFilter:     document.getElementById('semesterFilter'),
  loadingState:       document.getElementById('loadingState'),
  errorState:         document.getElementById('errorState'),
  dashboardContent:   document.getElementById('dashboardContent'),
  cardTargetOutput:   document.getElementById('cardTargetOutput'),
  cardRealisasiOut:   document.getElementById('cardRealisasiOut'),
  cardTargetAnggaran: document.getElementById('cardTargetAnggaran'),
  cardRealisasiAng:   document.getElementById('cardRealisasiAng'),
  cardRealisasiPct:   document.getElementById('cardRealisasiPct'),
  targetTabel:        document.getElementById('targetTabel'),
  catatanTabel:       document.getElementById('catatanTabel'),
  catatanTitle:       document.getElementById('catatanTitle'),
  tableInfo:          document.getElementById('tableInfo'),
  chartInner:         document.getElementById('chartInner'),
  anggaranChart:      document.getElementById('anggaranChart'),
  outputChartInner:   document.getElementById('outputChartInner'),
  outputChart:        document.getElementById('outputChart'),
};

// ============================================================
//  URL PARAMS & PAGE TITLE
// ============================================================
const urlParams  = new URLSearchParams(window.location.search);
const sheetTitle = urlParams.get('title') || 'Dashboard';

el.pageTitle.textContent       = 'Dashboard ' + sheetTitle;
el.breadcrumbTitle.textContent = sheetTitle;

// ============================================================
//  POPUP INPUT (Target / Realisasi)
// ============================================================
el.btnInput.addEventListener('click', openInputPopup);

function openInputPopup() {
  if (document.getElementById('inputChoiceOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'inputChoiceOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(5,12,22,0.6);backdrop-filter:blur(3px);font-family:Inter,sans-serif;';
  overlay.innerHTML =
    '<div style="width:380px;max-width:92vw;background:#0f2744;border:1px solid rgba(255,255,255,0.08);' +
    'border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<h3 style="color:#fff;font-size:17px;font-weight:600;margin:0;">Input Data — ' + escapeHtml(sheetTitle) + '</h3>' +
        '<button id="inputClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:22px;line-height:1;">&times;</button>' +
      '</div>' +
      '<p style="color:#94a3b8;font-size:13px;margin:0 0 18px;">Pilih jenis data yang ingin diinput.</p>' +
      '<button id="btnInputTarget" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:10px;' +
        'border:1px solid rgba(59,130,246,0.4);background:rgba(59,130,246,0.12);border-radius:12px;cursor:pointer;text-align:left;">' +
        '<span class="material-symbols-outlined" style="color:#60a5fa;">flag</span>' +
        '<span><span style="display:block;color:#fff;font-size:14px;font-weight:600;">Input Target</span>' +
        '<span style="color:#94a3b8;font-size:12px;">Tetapkan target output & anggaran</span></span>' +
      '</button>' +
      '<button id="btnInputRealisasi" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px;' +
        'border:1px solid rgba(52,211,153,0.4);background:rgba(52,211,153,0.12);border-radius:12px;cursor:pointer;text-align:left;">' +
        '<span class="material-symbols-outlined" style="color:#34d399;">trending_up</span>' +
        '<span><span style="display:block;color:#fff;font-size:14px;font-weight:600;">Input Realisasi</span>' +
        '<span style="color:#94a3b8;font-size:12px;">Catat realisasi per semester</span></span>' +
      '</button>' +
    '</div>';

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('inputClose').addEventListener('click', close);

  const back = '&back=' + encodeURIComponent(window.location.href);
  document.getElementById('btnInputTarget').addEventListener('click', () => {
    window.location.href = 'input-target.html?satker=' + encodeURIComponent(sheetTitle) + back;
  });
  document.getElementById('btnInputRealisasi').addEventListener('click', () => {
    window.location.href = 'input-realisasi.html?satker=' + encodeURIComponent(sheetTitle) + back;
  });
}

// ============================================================
//  HELPERS
// ============================================================
function parseNum(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  let s = String(val).replace(/[Rp\s]/gi, '').trim();
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function fmtJt(n) {
  const jt = n / 1_000_000;
  return (jt % 1 === 0 ? jt : parseFloat(jt.toFixed(2)).toString());
}
function fmtRupiah(n) {
  if (!n) return '-';
  if (n >= 1_000_000_000_000) return 'Rp ' + (n / 1_000_000_000_000).toFixed(1).replace('.0', '') + ' T';
  if (n >= 1_000_000_000)     return 'Rp ' + (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1_000_000)         return 'Rp ' + fmtJt(n) + ' Jt';
  if (n >= 1_000)             return 'Rp ' + Math.round(n / 1_000) + ' Rb';
  return 'Rp ' + n;
}
function fmtRupiahShort(n) {
  if (!n) return '-';
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1).replace('.0', '') + 'T';
  if (n >= 1_000_000_000)     return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000_000)         return fmtJt(n) + 'Jt';
  return String(n);
}
function fmtRupiahFull(n) { return n ? 'Rp ' + Number(n).toLocaleString('id-ID') : '-'; }
function fmtNum(n) { return n ? Number(n).toLocaleString('id-ID') : '-'; }
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
//  DATA (satu satker, banyak fokus / tahun)
// ============================================================
let allRows = [];
let selectedYear = null;
let selectedSem = 'I';

function parseRows(rows) {
  const out = [];
  for (const r of rows) {
    const v = r.values || [];
    const fokus = String(v[COL.FOKUS - 1] || '').trim();
    const tahun = parseNum(v[COL.TAHUN - 1]);
    if (!fokus || tahun < 2000) continue;
    out.push({
      fokus, tahun,
      tOut:  parseNum(v[COL.TARGET_OUTPUT - 1]),
      tAng:  parseNum(v[COL.TARGET_ANGGARAN - 1]),
      r1Out: parseNum(v[COL.REAL1_OUTPUT - 1]),
      r1Ang: parseNum(v[COL.REAL1_ANGGARAN - 1]),
      r2Out: parseNum(v[COL.REAL2_OUTPUT - 1]),
      r2Ang: parseNum(v[COL.REAL2_ANGGARAN - 1]),
      hamb1: String(v[COL.HAMBATAN1 - 1] || '').trim(),
      pend1: String(v[COL.PENDUKUNG1 - 1] || '').trim(),
      hamb2: String(v[COL.HAMBATAN2 - 1] || '').trim(),
      pend2: String(v[COL.PENDUKUNG2 - 1] || '').trim(),
      dd1:   String(v[COL.DATADUKUNG1 - 1] || '').trim(),
      dd2:   String(v[COL.DATADUKUNG2 - 1] || '').trim(),
    });
  }
  return out;
}

function currentRows() {
  return allRows.filter(r => r.tahun === selectedYear);
}

// ============================================================
//  RENDER
// ============================================================
function populateTahun() {
  const years = [...new Set(allRows.map(r => r.tahun))].sort((a, b) => b - a);
  if (!years.length) years.push(TAHUN_BERJALAN);
  el.tahunFilter.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  selectedYear = years.includes(TAHUN_BERJALAN) ? TAHUN_BERJALAN : years[0];
  el.tahunFilter.value = String(selectedYear);
}

function updateMetrics(rows) {
  const sum = k => rows.reduce((a, r) => a + r[k], 0);
  const tOut = sum('tOut');
  const tAng = sum('tAng');
  const realOut = sum('r1Out') + sum('r2Out');
  const realAng = sum('r1Ang') + sum('r2Ang');
  const pct = tAng > 0 ? Math.round((realAng / tAng) * 100) : 0;
  el.cardTargetOutput.textContent   = fmtNum(tOut);
  el.cardRealisasiOut.textContent   = fmtNum(realOut);
  el.cardTargetAnggaran.textContent = fmtRupiahFull(tAng);
  el.cardRealisasiAng.textContent   = fmtRupiahFull(realAng);
  el.cardRealisasiPct.textContent   = pct + '%';
}

function cellNum(v) { return v ? `<span class="font-medium">${fmtNum(v)}</span>` : '<span class="text-slate-300">-</span>'; }
function cellRp(v)  { return v ? `<span class="text-on-variant">${fmtRupiahFull(v)}</span>` : '<span class="text-slate-300">-</span>'; }

// Tombol pembuka link data dukung (hanya tampil bila link http/https ada di sheet)
function ddButton(url, label) {
  if (!/^https?:\/\//i.test(url)) return '';
  return `<button data-dd="${escapeHtml(url)}" title="${escapeHtml(url)}"
    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary-fixed text-secondary text-[11px] font-semibold hover:brightness-95 cursor-pointer">
    <span class="material-symbols-outlined" style="font-size:13px">open_in_new</span>${label}</button>`;
}

function renderTargetTable(rows) {
  if (!rows.length) {
    el.targetTabel.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-on-variant text-sm">Belum ada data untuk tahun ini</td></tr>`;
    el.tableInfo.textContent = 'Menampilkan 0 fokus';
    return;
  }
  el.targetTabel.innerHTML = rows.map((r, i) => {
    const realOut = selectedSem === 'I' ? r.r1Out : r.r2Out;
    const realAng = selectedSem === 'I' ? r.r1Ang : r.r2Ang;
    const ddBtns = [ddButton(r.dd1, 'Sem I'), ddButton(r.dd2, 'Sem II')].filter(Boolean);
    const ddCell = ddBtns.length
      ? `<div class="inline-flex flex-col items-stretch gap-1.5">${ddBtns.join('')}</div>`
      : '<span class="text-slate-300">-</span>';
    const zebra = i % 2 === 1 ? 'bg-slate-50/60' : '';
    return `<tr class="${zebra} hover:bg-surface-low/50 transition-colors">
      <td class="px-6 py-4 text-on-surface text-xs font-medium">${escapeHtml(r.fokus)}</td>
      <td class="px-4 py-4 text-center" style="white-space:nowrap">${cellNum(r.tOut)}</td>
      <td class="px-4 py-4 text-center" style="white-space:nowrap">${cellRp(r.tAng)}</td>
      <td class="px-4 py-4 text-center" style="white-space:nowrap">${cellNum(realOut)}</td>
      <td class="px-4 py-4 text-center" style="white-space:nowrap">${cellRp(realAng)}</td>
      <td class="px-4 py-4 text-center" style="white-space:nowrap">${ddCell}</td>
    </tr>`;
  }).join('');
  el.tableInfo.textContent = `Menampilkan ${rows.length} fokus prioritas · Tahun ${selectedYear} · Semester ${selectedSem}`;
}

// Buka link data dukung di browser eksternal
el.targetTabel.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-dd]');
  if (!btn) return;
  const url = btn.getAttribute('data-dd');
  if (window.electronAPI && window.electronAPI.openExternal) window.electronAPI.openExternal(url);
  else window.open(url, '_blank');
});

function renderCatatanTable(rows) {
  el.catatanTitle.textContent = `Hambatan & Pendukung — Semester ${selectedSem}`;
  if (!rows.length) {
    el.catatanTabel.innerHTML = `<tr><td colspan="3" class="py-10 text-center text-on-variant text-sm">Belum ada data</td></tr>`;
    return;
  }
  const cell = t => t ? escapeHtml(t) : '<span class="text-slate-300">-</span>';
  el.catatanTabel.innerHTML = rows.map((r, i) => {
    const hamb = selectedSem === 'I' ? r.hamb1 : r.hamb2;
    const pend = selectedSem === 'I' ? r.pend1 : r.pend2;
    const zebra = i % 2 === 1 ? 'bg-slate-50/60' : '';
    return `<tr class="${zebra} hover:bg-surface-low/50 transition-colors align-top">
      <td class="px-6 py-4 text-on-surface text-xs font-medium">${escapeHtml(r.fokus)}</td>
      <td class="px-6 py-4 text-on-variant text-xs leading-relaxed">${cell(hamb)}</td>
      <td class="px-6 py-4 text-on-variant text-xs leading-relaxed">${cell(pend)}</td>
    </tr>`;
  }).join('');
}

// ============================================================
//  CHARTS (per Fokus Prioritas: Target / Sem I / Sem II)
// ============================================================
let chartOutput = null, chartAnggaran = null;

function makeBarChart({ canvas, inner, labels, fullLabels, datasets, fmtValue, prev }) {
  // Canvas mengisi container (lebar penuh); melebar + scroll hanya bila fokus banyak
  inner.style.width = 'auto';
  inner.style.minWidth = Math.max(640, labels.length * 120) + 'px';
  inner.style.height = '400px';
  if (prev) prev.destroy();
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map(d => ({
        label: d.label, data: d.data, backgroundColor: d.color, borderRadius: 5, maxBarThickness: 46,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      categoryPercentage: 0.85,
      barPercentage: 0.92,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f2744',
          padding: 10,
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          callbacks: {
            title: items => (fullLabels && items.length) ? fullLabels[items[0].dataIndex] : '',
            label: ctx => ` ${ctx.dataset.label}: ${fmtValue(ctx.raw)}`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: v => fmtValue(v) } },
        x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 35, minRotation: 20, font: { size: 10 } } },
      },
    },
  });
}

function shortFokus(f) {
  return f.length > 24 ? f.slice(0, 22) + '…' : f;
}

function buildCharts(rows) {
  const labels = rows.map(r => shortFokus(r.fokus));
  const fullLabels = rows.map(r => r.fokus);
  chartOutput = makeBarChart({
    canvas: el.outputChart, inner: el.outputChartInner, labels, fullLabels,
    datasets: [
      { label: 'Target',       data: rows.map(r => r.tOut),  color: '#cbd5e1' },
      { label: 'Real. Sem I',  data: rows.map(r => r.r1Out), color: '#059669' },
      { label: 'Real. Sem II', data: rows.map(r => r.r2Out), color: '#4f46e5' },
    ],
    fmtValue: v => String(v), prev: chartOutput,
  });
  chartAnggaran = makeBarChart({
    canvas: el.anggaranChart, inner: el.chartInner, labels, fullLabels,
    datasets: [
      { label: 'Target',       data: rows.map(r => r.tAng),  color: '#cbd5e1' },
      { label: 'Real. Sem I',  data: rows.map(r => r.r1Ang), color: '#059669' },
      { label: 'Real. Sem II', data: rows.map(r => r.r2Ang), color: '#4f46e5' },
    ],
    fmtValue: v => fmtRupiahShort(v), prev: chartAnggaran,
  });
}

// ============================================================
//  RENDER ALL / FILTER
// ============================================================
function applyFilters() {
  const rows = currentRows();
  updateMetrics(rows);
  renderTargetTable(rows);
  renderCatatanTable(rows);
  buildCharts(rows);
}

el.tahunFilter.addEventListener('change', e => {
  selectedYear = Number(e.target.value);
  applyFilters();
});
el.semesterFilter.addEventListener('change', e => {
  selectedSem = e.target.value;
  applyFilters();
});

// ============================================================
//  BOOTSTRAP
// ============================================================
function showError(msg) {
  el.loadingState.classList.add('hidden');
  el.errorState.classList.remove('hidden');
  el.errorState.classList.add('flex');
  if (msg) {
    const p = el.errorState.querySelector('p.text-on-variant');
    if (p) p.textContent = msg;
  }
}

async function loadDashboard() {
  const res = await appsScriptRequest({ action: 'list', sheet: sheetTitle });
  if (!res || !res.ok || !Array.isArray(res.rows)) {
    return showError((res && res.error) || 'Periksa koneksi internet Anda');
  }
  allRows = parseRows(res.rows);

  el.loadingState.classList.add('hidden');
  el.dashboardContent.classList.remove('hidden');

  populateTahun();
  applyFilters();
}

loadDashboard();

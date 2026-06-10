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
    } catch(_) {}
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
  pageTitle:        document.getElementById('pageTitle'),
  breadcrumbTitle:  document.getElementById('breadcrumbTitle'),
  btnInput:         document.getElementById('btnInput'),
  searchInput:      document.getElementById('searchInput'),
  fokusFilter:      document.getElementById('fokusFilter'),
  loadingState:     document.getElementById('loadingState'),
  errorState:       document.getElementById('errorState'),
  dashboardContent: document.getElementById('dashboardContent'),
  cardTotalSatker:  document.getElementById('cardTotalSatker'),
  cardTargetOutput: document.getElementById('cardTargetOutput'),
  cardAnggaran:     document.getElementById('cardAnggaran'),
  cardRealisasiPct: document.getElementById('cardRealisasiPct'),
  satkerTabel:      document.getElementById('satkerTabel'),
  tableInfo:        document.getElementById('tableInfo'),
  chartInner:       document.getElementById('chartInner'),
  anggaranChart:    document.getElementById('anggaranChart'),
  outputChartInner: document.getElementById('outputChartInner'),
  outputChart:      document.getElementById('outputChart'),
};

// ============================================================
//  URL PARAMS & PAGE TITLE
// ============================================================
const urlParams  = new URLSearchParams(window.location.search);
const sheetId    = urlParams.get('sheetId');
const sheetTitle = urlParams.get('title') || 'Dashboard';
const sheetUrl   = urlParams.get('sheetUrl');

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
//  FORMATTING & HTML HELPERS
// ============================================================
function parseCSV(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const cols = [];
    let cur = '', q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function parseNum(val) {
  if (!val) return 0;
  let s = String(val).replace(/[Rp\s]/gi, '').trim();
  if (/[jJ][tT]$/.test(s))
    return parseFloat(s.replace(/[jJ][tT]$/, '').replace(/\./g, '').replace(',', '.')) * 1_000_000 || 0;
  if (/[mM]$/.test(s))
    return parseFloat(s.replace(/[mM]$/, '').replace(/\./g, '').replace(',', '.')) * 1_000_000 || 0;
  if (/[kK]$/.test(s))
    return parseFloat(s.replace(/[kK]$/, '').replace(/\./g, '').replace(',', '.')) * 1_000 || 0;
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function fmtJt(n) {
  const jt = n / 1_000_000;
  return (jt % 1 === 0 ? jt : parseFloat(jt.toFixed(2)).toString());
}

function fmtRupiah(n) {
  if (!n) return '-';
  if (n >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1_000_000)     return 'Rp ' + fmtJt(n) + ' Jt';
  if (n >= 1_000)         return 'Rp ' + Math.round(n / 1_000) + ' Rb';
  return 'Rp ' + n;
}

function fmtRupiahShort(n) {
  if (!n) return '-';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000_000)     return fmtJt(n) + 'Jt';
  return String(n);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
//  DATA PARSING
// ============================================================
function parseSatkerData(rows) {
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (/^\d+$/.test((r[0] || '').trim()) && parseInt(r[0]) >= 1) {
      if (/^\d+$/.test((r[1] || '').trim())) continue;
      dataStart = i; break;
    }
  }
  if (dataStart < 0) return [];

  const list = [];
  let cur = null;
  for (let i = dataStart; i < rows.length; i++) {
    const row  = rows[i];
    const noV  = (row[0] || '').trim();
    const satV = (row[1] || '').trim();
    const fokV = (row[2] || '').trim();

    if (/^\d+$/.test(noV) && parseInt(noV) >= 1) {
      cur = { no: noV, satker: satV, fokusData: [] };
      list.push(cur);
    }
    if (cur && fokV) {
      cur.fokusData.push({
        fokus:          fokV,
        targetOutput:   parseNum(row[3]),
        satuan:         (row[4] || '').trim(),
        targetAnggaran: parseNum(row[5]),
        realOutput:     parseNum(row[6]),
        realAnggaran:   parseNum(row[8]),
      });
    }
  }
  return list;
}

function collectFokus(list) {
  const seen = new Set(), arr = [];
  for (const s of list) for (const f of s.fokusData) {
    if (!seen.has(f.fokus)) { seen.add(f.fokus); arr.push(f.fokus); }
  }
  return arr;
}

// ============================================================
//  STATE
// ============================================================
const ALL_FOKUS = '__all__';
let allSatker       = [];
let allFokusOptions = [];
let selectedFokus   = ALL_FOKUS;
let chartOutput     = null;
let chartAnggaran   = null;

function relevantFokus(s) {
  return selectedFokus === ALL_FOKUS
    ? s.fokusData
    : s.fokusData.filter(f => f.fokus === selectedFokus);
}

// ============================================================
//  DATA PROJECTION
// ============================================================
function projectList() {
  if (selectedFokus === ALL_FOKUS) {
    const result = [];
    for (const s of allSatker) {
      if (!s.fokusData.length) {
        result.push({
          no: s.no, satker: s.satker, fokus: '-',
          targetOutput: 0, satuan: '', targetAnggaran: 0, realOutput: 0, realAnggaran: 0,
          hasData: false, isFirstFokus: true, fokusCount: 1,
        });
        continue;
      }
      s.fokusData.forEach((f, fi) => result.push({
        no: s.no, satker: s.satker, fokus: f.fokus,
        targetOutput: f.targetOutput, satuan: f.satuan, targetAnggaran: f.targetAnggaran,
        realOutput:   f.realOutput,   realAnggaran:   f.realAnggaran,
        hasData: true, isFirstFokus: fi === 0, fokusCount: s.fokusData.length,
      }));
    }
    return result;
  }
  return allSatker.map(s => {
    const rows = s.fokusData.filter(f => f.fokus === selectedFokus);
    const sum  = key => rows.reduce((a, r) => a + r[key], 0);
    const satuan = (rows.find(r => r.satuan) || {}).satuan || '';
    return {
      no: s.no, satker: s.satker, fokus: selectedFokus,
      targetOutput: sum('targetOutput'), satuan, targetAnggaran: sum('targetAnggaran'),
      realOutput:   sum('realOutput'),   realAnggaran:   sum('realAnggaran'),
      hasData: rows.length > 0, isFirstFokus: true, fokusCount: 1,
    };
  });
}

function chartList(q) {
  return allSatker
    .filter(s => !q || s.satker === q)
    .map(s => {
      const rows = relevantFokus(s);
      const sum  = key => rows.reduce((a, r) => a + r[key], 0);
      return {
        satker: s.satker,
        targetOutput: sum('targetOutput'), targetAnggaran: sum('targetAnggaran'),
        realOutput:   sum('realOutput'),   realAnggaran:   sum('realAnggaran'),
      };
    });
}

// ============================================================
//  RENDERING
// ============================================================
function populateSatkerSelect() {
  const opts = ['<option value="">Semua Satker</option>']
    .concat(allSatker.map(s => `<option value="${escapeHtml(s.satker)}">${escapeHtml(s.satker)}</option>`));
  el.searchInput.innerHTML = opts.join('');
  el.searchInput.value = '';
}

function populateFokusSelect() {
  const opts = [`<option value="${ALL_FOKUS}">Semua Fokus Prioritas</option>`]
    .concat(allFokusOptions.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`));
  el.fokusFilter.innerHTML = opts.join('');
  selectedFokus = ALL_FOKUS;
  el.fokusFilter.value = ALL_FOKUS;
}

function updateMetrics(list) {
  const satkerNos = new Set(list.map(s => s.no));
  let tarOut = 0, tarAng = 0, realOut = 0;
  for (const s of allSatker) {
    if (!satkerNos.has(s.no)) continue;
    for (const f of relevantFokus(s)) {
      tarOut  += f.targetOutput;
      tarAng  += f.targetAnggaran;
      realOut += f.realOutput;
    }
  }
  const pct = tarOut > 0 ? Math.round((realOut / tarOut) * 100) : 0;
  el.cardTotalSatker.textContent  = satkerNos.size;
  el.cardTargetOutput.textContent = tarOut || '-';
  el.cardAnggaran.textContent     = fmtRupiah(tarAng);
  el.cardRealisasiPct.textContent = pct + '%';
}

function renderTable(list) {
  if (!list.length) {
    el.satkerTabel.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-on-variant text-sm">Tidak ada data</td></tr>`;
    el.tableInfo.textContent = 'Menampilkan 0 satker';
    return;
  }

  let groupIdx = -1, lastNo = null;
  el.satkerTabel.innerHTML = list.map(s => {
    if (s.no !== lastNo) { groupIdx++; lastNo = s.no; }
    const zebra   = groupIdx % 2 === 1 ? 'bg-slate-50/60' : '';
    const satuan  = s.satuan ? ' ' + escapeHtml(s.satuan) : '';
    const realOut = s.realOutput   ? `<span class="text-secondary font-semibold">${s.realOutput}${satuan}</span>`  : `<span class="text-slate-300">-</span>`;
    const realAng = s.realAnggaran ? `<span class="text-on-variant">${fmtRupiah(s.realAnggaran)}</span>` : `<span class="text-slate-300">-</span>`;
    const tarOut  = s.targetOutput ? `${s.targetOutput}${satuan}` : '-';
    const tarAng  = s.targetAnggaran ? fmtRupiah(s.targetAnggaran) : '-';
    const fokus   = s.hasData ? escapeHtml(s.fokus) : `<span class="text-slate-300 italic">tidak tersedia</span>`;

    const rowspan    = s.fokusCount > 1 ? ` rowspan="${s.fokusCount}"` : '';
    const borderTop  = s.isFirstFokus ? 'border-t border-slate-200' : '';
    const groupCells = s.isFirstFokus
      ? `<td class="px-6 py-4 text-on-variant align-top border-t border-slate-200"${rowspan}>${s.no}</td>
         <td class="px-6 py-4 font-medium text-on-surface align-top border-t border-slate-200"${rowspan}>${escapeHtml(s.satker || '-')}</td>`
      : '';

    return `<tr class="${zebra} hover:bg-surface-low/50 transition-colors">
      ${groupCells}
      <td class="px-6 py-4 text-on-variant text-xs ${borderTop}">${fokus}</td>
      <td class="px-4 py-4 text-center font-medium ${borderTop}">${tarOut}</td>
      <td class="px-4 py-4 text-center text-on-variant ${borderTop}">${tarAng}</td>
      <td class="px-4 py-4 text-center ${borderTop}">${realOut}</td>
      <td class="px-4 py-4 text-center ${borderTop}">${realAng}</td>
    </tr>`;
  }).join('');

  const satkerCount = new Set(list.map(s => s.no)).size;
  el.tableInfo.textContent = `Menampilkan ${satkerCount} satker` +
    (selectedFokus === ALL_FOKUS ? `, ${list.length} baris fokus` : '') +
    ` dari ${allSatker.length} total satker`;
}

function makeBarChart({ canvas, inner, labels, target, real, color, targetLabel, realLabel, fmtValue, prev }) {
  const minPx = 60;
  inner.style.minWidth = Math.max(400, labels.length * minPx * 2 + 100) + 'px';
  if (prev) prev.destroy();

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: targetLabel, data: target, backgroundColor: '#cbd5e1', borderRadius: 5, barThickness: minPx - 12 },
        { label: realLabel,   data: real,   backgroundColor: color,    borderRadius: 5, barThickness: minPx - 12 },
      ],
    },
    options: {
      layout: { padding: { top: 24 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtValue(ctx.raw)}` } },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: v => fmtValue(v) } },
        x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 35, minRotation: 20 } },
      },
    },
    plugins: [{
      id: 'barLabel',
      afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        data.datasets.forEach((ds, di) => {
          chart.getDatasetMeta(di).data.forEach((bar, idx) => {
            const v = ds.data[idx]; if (!v) return;
            ctx.save();
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = di === 0 ? '#94a3b8' : color;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(fmtValue(v), bar.x, bar.y - 3);
            ctx.restore();
          });
        });
      },
    }],
  });
}

function buildCharts(list) {
  const labels = list.map(s => s.satker.replace(/^BNNP?\s*/i, '').replace(/^BNNK?\s*/i, ''));

  chartOutput = makeBarChart({
    canvas:      el.outputChart,
    inner:       el.outputChartInner,
    labels,
    target:      list.map(s => s.targetOutput),
    real:        list.map(s => s.realOutput),
    color:       '#059669',
    targetLabel: 'Target Output',
    realLabel:   'Realisasi Output',
    fmtValue:    v => String(v),
    prev:        chartOutput,
  });

  chartAnggaran = makeBarChart({
    canvas:      el.anggaranChart,
    inner:       el.chartInner,
    labels,
    target:      list.map(s => s.targetAnggaran),
    real:        list.map(s => s.realAnggaran),
    color:       '#4f46e5',
    targetLabel: 'Target Anggaran',
    realLabel:   'Realisasi Anggaran',
    fmtValue:    v => fmtRupiahShort(v),
    prev:        chartAnggaran,
  });
}

// ============================================================
//  FILTER / EVENTS
// ============================================================
function applyFilters() {
  const q         = el.searchInput.value;
  const projected = projectList();
  const filtered  = !q ? projected : projected.filter(s => s.satker === q);
  renderTable(filtered);
  updateMetrics(filtered);
  buildCharts(chartList(q));
}

el.searchInput.addEventListener('change', applyFilters);
el.fokusFilter.addEventListener('change', e => {
  selectedFokus = e.target.value;
  applyFilters();
});

// ============================================================
//  BOOTSTRAP
// ============================================================
function showError() {
  el.loadingState.classList.add('hidden');
  el.errorState.classList.remove('hidden');
  el.errorState.classList.add('flex');
}

async function loadDashboard() {
  if (!sheetId) return showError();
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    if (!res.ok) throw new Error('fetch failed');
    const rows = parseCSV(await res.text());
    allSatker       = parseSatkerData(rows);
    allFokusOptions = collectFokus(allSatker);

    el.loadingState.classList.add('hidden');
    el.dashboardContent.classList.remove('hidden');

    populateSatkerSelect();
    populateFokusSelect();
    applyFilters();
  } catch (_) {
    showError();
  }
}

loadDashboard();

// Script halaman Viewer Google Sheet (web-view.html) — menampilkan sheet di dalam <webview>.

const session = getSession();
document.getElementById('userBadge').textContent =
  session.region === '*' ? 'Master' : session.region;

// Accordion: hanya satu grup menu sidebar yang terbuka pada satu waktu.
function aturAccordionSidebar() {
  const semuaGrup = document.querySelectorAll('#sidebar details');
  semuaGrup.forEach(grup => {
    grup.addEventListener('toggle', () => {
      if (grup.open) semuaGrup.forEach(lain => { if (lain !== grup) lain.open = false; });
    });
  });
}

// Highlight link sidebar untuk sheet yang sedang dibuka.
// Cocokkan via param1 (URL sheet); kalau tidak ketemu, fallback ke kecocokan title.
function highlightMenuAktif() {
  const halamanSekarang = window.location.pathname.split('/').pop() || 'index.html';
  const paramSekarang = new URLSearchParams(window.location.search);
  let cocok = null, cadangan = null;

  for (const link of document.querySelectorAll('#sidebar a')) {
    const href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') continue; // lewati link non-navigasi (mis. Survey)
    try {
      const tujuan = new URL(link.href, window.location.href);
      if (tujuan.pathname.split('/').pop() === halamanSekarang) {
        if (halamanSekarang === 'web-view.html') {
          if (tujuan.searchParams.get('param1') === paramSekarang.get('param1')) { cocok = link; break; }
        } else if (halamanSekarang === 'dashboard-ananda.html') {
          if (tujuan.searchParams.get('sheetId') === paramSekarang.get('sheetId')) { cocok = link; break; }
        } else { cocok = link; break; }
      }
      if (!cadangan && paramSekarang.get('title') && tujuan.searchParams.get('title') === paramSekarang.get('title')) {
        cadangan = link;
      }
    } catch (e) {}
  }

  const terpilih = cocok || cadangan;
  if (terpilih) {
    terpilih.classList.add('active');
    const grup = terpilih.closest('details');
    if (grup) grup.open = true;
  }
}

// Tombol buka/tutup sidebar.
function aktifkanToggleSidebar() {
  const tombol  = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');
  const konten  = document.getElementById('main');
  let terbuka = true;
  tombol.addEventListener('click', () => {
    terbuka = !terbuka;
    sidebar.classList.toggle('-translate-x-full', !terbuka);
    konten.classList.toggle('ml-64', terbuka);
    konten.classList.toggle('ml-0', !terbuka);
  });
}

// Muat & tampilkan Google Sheet di <webview>. Hanya izinkan URL docs.google.com/spreadsheets.
function tampilkanSheet() {
  const params = new URLSearchParams(window.location.search);
  const url    = params.get('param1');
  const title  = params.get('title') || '';

  // Kontrol akses: non-master hanya boleh membuka sheet region-nya sendiri.
  if (session.region !== '*' && title && title !== session.region) {
    window.location.replace('index.html');
    return;
  }

  const webview    = document.getElementById('myWebView');
  const loading    = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMsg   = document.getElementById('errorMsg');
  const pageTitle  = document.getElementById('pageTitle');

  if (title) pageTitle.textContent = title;

  const tampilkanError = (pesan) => {
    loading.classList.add('hidden');
    webview.classList.add('hidden');
    webview.classList.remove('flex');
    if (pesan) errorMsg.textContent = pesan;
    errorState.classList.remove('hidden');
    errorState.classList.add('flex');
  };

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'docs.google.com' || !parsed.pathname.startsWith('/spreadsheets/')) {
      throw new Error('URL tidak diizinkan');
    }
    webview.setAttribute('src', url);

    webview.addEventListener('did-finish-load', () => {
      loading.classList.add('hidden');
      errorState.classList.add('hidden');
      errorState.classList.remove('flex');
      webview.classList.remove('hidden');
      webview.classList.add('flex');
    });

    webview.addEventListener('did-fail-load', (e) => {
      if (!e.isMainFrame) return;
      if (e.errorCode === -3) return; // -3 = dibatalkan (mis. redirect), bukan error nyata
      tampilkanError();
    });
  } catch (e) {
    tampilkanError('URL tidak valid atau tidak diizinkan.');
  }
}

aktifkanToggleSidebar();
document.addEventListener('DOMContentLoaded', () => {
  fetch('sidebar.html').then(r => r.text()).then(html => {
    document.getElementById('sidebar').innerHTML = html;
    filterSidebar();
    aturAccordionSidebar();
    highlightMenuAktif();
  });
  tampilkanSheet();
});

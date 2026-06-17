const session = getSession();
document.getElementById('userBadge').textContent = session.region === '*' ? 'Master' : session.region;

function initSidebarAccordion() {
  const all = document.querySelectorAll('#sidebar details');
  all.forEach(det => {
    det.addEventListener('toggle', () => {
      if (det.open) all.forEach(other => { if (other !== det) other.open = false; });
    });
  });
}

function activateSidebarLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentParams = new URLSearchParams(window.location.search);
  let best = null, fallback = null;
  for (const a of document.querySelectorAll('#sidebar a')) {
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') continue; // lewati link non-navigasi (mis. Survey)
    try {
      const u = new URL(a.href, window.location.href);
      const aPage = u.pathname.split('/').pop();
      if (aPage === currentPage) {
        if (currentPage === 'web-view.html') {
          if (u.searchParams.get('param1') === currentParams.get('param1')) { best = a; break; }
        } else if (currentPage === 'dashboard-ananda.html') {
          if (u.searchParams.get('sheetId') === currentParams.get('sheetId')) { best = a; break; }
        } else { best = a; break; }
      }
      if (!fallback && currentParams.get('title') && u.searchParams.get('title') === currentParams.get('title')) {
        fallback = a;
      }
    } catch(e) {}
  }
  const target = best || fallback;
  if (target) {
    target.classList.add('active');
    const det = target.closest('details');
    if (det) det.open = true;
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  fetch('sidebar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('sidebar').innerHTML = html;
      filterSidebar();
      initSidebarAccordion();
      activateSidebarLink();
    });

  const urlParams  = new URLSearchParams(window.location.search);
  const url        = urlParams.get('param1');
  const title      = urlParams.get('title') || '';

  if (session.region !== '*' && title && title !== session.region) {
    window.location.replace('index.html');
    return;
  }

  const webView    = document.getElementById('myWebView');
  const loading    = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMsg   = document.getElementById('errorMsg');
  const pageTitle  = document.getElementById('pageTitle');

  if (title) pageTitle.textContent = title;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'docs.google.com' || !parsed.pathname.startsWith('/spreadsheets/')) {
      throw new Error('URL tidak diizinkan');
    }

    webView.setAttribute('src', url);

    webView.addEventListener('did-finish-load', () => {
      loading.classList.add('hidden');
      errorState.classList.add('hidden');
      errorState.classList.remove('flex');
      webView.classList.remove('hidden');
      webView.classList.add('flex');
    });

    webView.addEventListener('did-fail-load', (e) => {
      if (!e.isMainFrame) return;
      if (e.errorCode === -3) return;
      loading.classList.add('hidden');
      webView.classList.add('hidden');
      webView.classList.remove('flex');
      errorState.classList.remove('hidden');
      errorState.classList.add('flex');
    });

  } catch (e) {
    loading.classList.add('hidden');
    errorMsg.textContent = 'URL tidak valid atau tidak diizinkan.';
    errorState.classList.remove('hidden');
    errorState.classList.add('flex');
  }
});

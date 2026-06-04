const CREDENTIALS = {
  'bnnpaceh.4bnn':      { password: '123456',       region: 'Aceh' },
  'bnnpsumut.7bnn':     { password: '123456',       region: 'Sumatera Utara' },
  'bnnpsumbar.2bnn':    { password: '123456',       region: 'Sumatera Barat' },
  'bnnpriau.9bnn':      { password: '123456',       region: 'Riau' },
  'bnnpkepri.1bnn':     { password: '123456',       region: 'Kepulauan Riau' },
  'bnnpjambi.5bnn':     { password: '123456',       region: 'Jambi' },
  'bnnpsumsel.8bnn':    { password: '123456',       region: 'Sumatera Selatan' },
  'bnnpbabel.3bnn':     { password: '123456',       region: 'Bangka Belitung' },
  'bnnpbengkulu.6bnn':  { password: '123456',       region: 'Bengkulu' },
  'bnnplampung.10bnn':  { password: '123456',       region: 'Lampung' },
  'bnnpdki.2bnn':       { password: '123456',       region: 'DKI Jakarta' },
  'bnnpbanten.7bnn':    { password: '123456',       region: 'Banten' },
  'bnnpjabar.4bnn':     { password: '123456',       region: 'Jawa Barat' },
  'bnnpjateng.9bnn':    { password: '123456',       region: 'Jawa Tengah' },
  'bnnpdiy.1bnn':       { password: '123456',       region: 'DIY' },
  'bnnpjatim.5bnn':     { password: '123456',       region: 'Jawa Timur' },
  'bnnpbali.8bnn':      { password: '123456',       region: 'Bali' },
  'bnnpntb.3bnn':       { password: '123456',       region: 'NTB' },
  'bnnpntt.6bnn':       { password: '123456',       region: 'NTT' },
  'bnnpkalbar.10bnn':   { password: '123456',       region: 'Kalimantan Barat' },
  'bnnpkalteng.2bnn':   { password: '123456',       region: 'Kalimantan Tengah' },
  'bnnpkalsel.7bnn':    { password: '123456',       region: 'Kalimantan Selatan' },
  'bnnpkaltim.4bnn':    { password: '123456',       region: 'Kalimantan Timur' },
  'bnnpkaltara.9bnn':   { password: '123456',       region: 'Kalimantan Utara' },
  'bnnpsulut.1bnn':     { password: '123456',       region: 'Sulawesi Utara' },
  'bnnpgorontalo.5bnn': { password: '123456',       region: 'Gorontalo' },
  'bnnpsulteng.8bnn':   { password: '123456',       region: 'Sulawesi Tengah' },
  'bnnpsulbar.3bnn':    { password: '123456',       region: 'Sulawesi Barat' },
  'bnnpsulsel.6bnn':    { password: '123456',       region: 'Sulawesi Selatan' },
  'bnnpsultra.10bnn':   { password: '123456',       region: 'Sulawesi Tenggara' },
  'bnnpmaluku.2bnn':    { password: '123456',       region: 'Maluku' },
  'bnnpmalut.7bnn':     { password: '123456',       region: 'Maluku Utara' },
  'bnnppapua.4bnn':     { password: '123456',       region: 'Papua' },
  'bnnppabar.9bnn':     { password: '123456',       region: 'Papua Barat' },
  'master.1bnn':        { password: 'MasterSimanda', region: '*' },
};

function authLogin(username, password) {
  const cred = CREDENTIALS[username.toLowerCase()];
  if (!cred || cred.password !== password) return null;
  return { username: username.toLowerCase(), region: cred.region };
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('simanda_session')); } catch { return null; }
}

function requireAuth() {
  const s = getSession();
  if (!s) { window.location.replace('login.html'); return null; }
  return s;
}

function doLogout() {
  localStorage.removeItem('simanda_session');
  window.location.replace('login.html');
}

function authLogout() {
  if (document.getElementById('logoutConfirmOverlay')) return; // sudah terbuka

  const overlay = document.createElement('div');
  overlay.id = 'logoutConfirmOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(5,12,22,0.65);backdrop-filter:blur(3px);';

  overlay.innerHTML =
    '<div role="dialog" aria-modal="true" style="width:340px;max-width:90vw;background:#0f2744;' +
    'border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);' +
    'font-family:Inter,sans-serif;transform:scale(0.96);opacity:0;transition:transform .15s ease,opacity .15s ease;">' +
      '<div style="width:48px;height:48px;border-radius:14px;background:rgba(239,68,68,0.15);' +
      'display:flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
        '<svg width="24" height="24" fill="none" stroke="#f87171" stroke-width="2" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>' +
      '</div>' +
      '<h3 style="color:#fff;font-size:17px;font-weight:600;margin:0 0 6px;">Keluar dari Akun?</h3>' +
      '<p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 20px;">Anda akan keluar dari SI MANDA dan kembali ke halaman login.</p>' +
      '<div style="display:flex;gap:10px;">' +
        '<button id="logoutCancelBtn" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,0.12);' +
        'background:rgba(255,255,255,0.04);color:#cbd5e1;font-size:14px;font-weight:500;border-radius:10px;cursor:pointer;">Batal</button>' +
        '<button id="logoutConfirmBtn" style="flex:1;padding:10px;border:none;' +
        'background:#dc2626;color:#fff;font-size:14px;font-weight:600;border-radius:10px;cursor:pointer;">Keluar</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  const card = overlay.firstElementChild;
  requestAnimationFrame(() => { card.style.transform = 'scale(1)'; card.style.opacity = '1'; });

  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter') doLogout();
  };

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#logoutCancelBtn').addEventListener('click', close);
  overlay.querySelector('#logoutConfirmBtn').addEventListener('click', doLogout);
  document.addEventListener('keydown', onKey);
}

function filterSidebar() {
  const s = getSession();
  if (!s || s.region === '*') return;
  document.querySelectorAll('#sidebar details ul li').forEach(li => {
    const a = li.querySelector('a[href]');
    if (!a) return;
    try {
      const u = new URL(a.href);
      const title = u.searchParams.get('title') || '';
      if (title !== s.region) li.style.display = 'none';
    } catch {}
  });
  document.querySelectorAll('#sidebar details').forEach(det => {
    const hasVisible = [...det.querySelectorAll('ul li')].some(li => li.style.display !== 'none');
    if (!hasVisible) det.style.display = 'none';
  });
}

// ============================================================
//  TANIA — widget support (floating button + popup) di semua halaman
//  GANTI link dummy di bawah dengan link WhatsApp asli nanti.
// ============================================================
const TANIA_LINK = 'https://wa.me/6281280391887?text=Halo%20TANIA'; // dummy — contoh nanti: https://wa.me/62812xxxxxxx?text=Halo%20TANIA

function openTaniaLink() {
  if (!TANIA_LINK || TANIA_LINK === '#') return;
  if (window.electronAPI && window.electronAPI.openExternal) window.electronAPI.openExternal(TANIA_LINK);
  else window.open(TANIA_LINK, '_blank');
}

function initTaniaWidget() {
  if (document.getElementById('taniaFab')) return;

  const chatIcon = (size, stroke) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  const style = document.createElement('style');
  style.textContent =
    '#taniaFab:hover{filter:brightness(1.08);transform:translateY(-2px);}' +
    '#taniaFab{transition:transform .15s ease,filter .15s ease;}' +
    '#taniaWaBtn:hover{filter:brightness(1.05);}' +
    '#taniaClose:hover{color:#e2e8f0;}';
  document.head.appendChild(style);

  // Floating button
  const fab = document.createElement('button');
  fab.id = 'taniaFab';
  fab.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:99990;display:flex;align-items:center;gap:8px;' +
    'padding:12px 18px;border:none;border-radius:999px;background:#8a8456;color:#fff;' +
    'font-family:Inter,sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  fab.innerHTML = chatIcon(20, '#fff') + '<span>TANIA</span>';

  // Popup
  const popup = document.createElement('div');
  popup.id = 'taniaPopup';
  popup.style.cssText =
    'position:fixed;bottom:88px;right:24px;width:360px;max-width:calc(100vw - 32px);z-index:99991;' +
    'background:#0a1929;border:1px solid rgba(255,255,255,0.08);border-radius:18px;' +
    'box-shadow:0 24px 70px rgba(0,0,0,0.55);overflow:hidden;display:none;font-family:Inter,sans-serif;';
  popup.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">' +
      '<div style="width:40px;height:40px;border-radius:11px;background:#8a8456;display:flex;align-items:center;justify-content:center;shrink:0;">' +
        chatIcon(22, '#fff') +
      '</div>' +
      '<span style="flex:1;color:#fff;font-family:Manrope,Inter,sans-serif;font-size:20px;font-weight:700;letter-spacing:0.5px;">TANIA</span>' +
      '<button id="taniaClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:22px;line-height:1;padding:0;">&times;</button>' +
    '</div>' +
    '<div style="padding:20px;">' +
      '<h3 style="color:#fff;font-family:Manrope,Inter,sans-serif;font-size:18px;font-weight:700;line-height:1.35;margin:0 0 10px;">Bingung terkait bidang administrasi pemerintahan di BNN?</h3>' +
      '<p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin:0 0 18px;">Konsultasikan dengan TANIA — Tim Layanan Inspektorat I siap membantu Anda dengan cepat dan profesional.</p>' +
      '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:26px 16px;text-align:center;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:center;">' + chatIcon(40, '#cbd5e1') + '</div>' +
        '<p style="color:#94a3b8;font-size:12.5px;line-height:1.5;margin:14px 0 0;">Hubungi kami melalui WhatsApp untuk konsultasi langsung</p>' +
      '</div>' +
      '<button id="taniaWaBtn" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#25D366,#1eae54);color:#fff;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:filter .15s ease;">' +
        chatIcon(20, '#fff') + 'Hubungi via WhatsApp' +
      '</button>' +
      '<div style="border-top:1px solid rgba(255,255,255,0.07);margin-top:18px;padding-top:14px;text-align:center;">' +
        '<span style="color:#64748b;font-size:11.5px;">Respons cepat • Tim profesional • Solusi terpercaya</span>' +
      '</div>' +
    '</div>';

  document.body.appendChild(fab);
  document.body.appendChild(popup);

  const toggle = (show) => { popup.style.display = (show ?? popup.style.display === 'none') ? 'block' : 'none'; };

  fab.addEventListener('click', () => toggle());
  popup.querySelector('#taniaClose').addEventListener('click', () => toggle(false));
  popup.querySelector('#taniaWaBtn').addEventListener('click', openTaniaLink);
}

document.addEventListener('DOMContentLoaded', () => {
  if (getSession()) initTaniaWidget();
});

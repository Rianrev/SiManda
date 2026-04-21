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

function authLogout() {
  localStorage.removeItem('simanda_session');
  window.location.replace('login.html');
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

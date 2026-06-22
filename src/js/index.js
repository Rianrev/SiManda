// Script halaman Beranda (index.html).

// 1. Tampilkan region user di badge header ("Master" untuk akun master).
const session = getSession();
document.getElementById('userBadge').textContent =
  session.region === '*' ? 'Master' : session.region;

// 2. Tombol buka/tutup sidebar.
function aktifkanToggleSidebar() {
  const tombol  = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');
  const konten  = document.getElementById('main');
  let terbuka = true;

  tombol.addEventListener('click', () => {
    terbuka = !terbuka;
    sidebar.classList.toggle('-translate-x-full', !terbuka); // geser keluar saat tutup
    konten.classList.toggle('ml-64', terbuka);               // beri ruang sidebar saat buka
    konten.classList.toggle('ml-0', !terbuka);
  });
}

// 3. Partikel mengambang sebagai dekorasi background.
function buatPartikel() {
  const wadah = document.getElementById('particles');
  if (!wadah) return;
  for (let i = 0; i < 30; i++) {
    const titik = document.createElement('span');
    titik.className = 'particle';
    titik.style.left             = Math.random() * 100 + '%';
    titik.style.animationDuration = (8 + Math.random() * 12) + 's';
    titik.style.animationDelay    = (Math.random() * 10) + 's';
    titik.style.opacity           = (0.3 + Math.random() * 0.5).toFixed(2);
    const ukuran = 2 + Math.random() * 3;
    titik.style.width  = ukuran + 'px';
    titik.style.height = ukuran + 'px';
    wadah.appendChild(titik);
  }
}

// Accordion: hanya satu grup menu yang terbuka pada satu waktu.
function aturAccordionSidebar() {
  const semuaGrup = document.querySelectorAll('#sidebar details');
  semuaGrup.forEach(grup => {
    grup.addEventListener('toggle', () => {
      if (grup.open) semuaGrup.forEach(lain => { if (lain !== grup) lain.open = false; });
    });
  });
}

// Tandai (highlight) link sidebar yang cocok dengan halaman yang sedang dibuka.
function highlightMenuAktif() {
  const halamanSekarang = window.location.pathname.split('/').pop() || 'index.html';
  for (const link of document.querySelectorAll('#sidebar a')) {
    const href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') continue; // lewati link non-navigasi (mis. Survey)
    try {
      const tujuan = new URL(link.href, window.location.href);
      if (tujuan.pathname.split('/').pop() === halamanSekarang) {
        link.classList.add('active');
        break;
      }
    } catch (e) {}
  }
}

// 4. Muat sidebar (fragment HTML), lalu pasang filter region, accordion, dan highlight.
function muatSidebar() {
  fetch('sidebar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('sidebar').innerHTML = html;
      filterSidebar();          // sembunyikan menu yang tak boleh dilihat user (dari auth.js)
      aturAccordionSidebar();
      highlightMenuAktif();
    });
}

aktifkanToggleSidebar();
buatPartikel();
document.addEventListener('DOMContentLoaded', muatSidebar);

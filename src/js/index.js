const session = getSession();
document.getElementById('userBadge').textContent = session.region === '*' ? 'Master' : session.region;

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

// Generate floating tech particles
(() => {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left              = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay    = (Math.random() * 10) + 's';
    p.style.opacity           = (0.3 + Math.random() * 0.5).toFixed(2);
    const s = 2 + Math.random() * 3;
    p.style.width  = s + 'px';
    p.style.height = s + 'px';
    container.appendChild(p);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  fetch('sidebar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('sidebar').innerHTML = html;
      filterSidebar();
      const all = document.querySelectorAll('#sidebar details');
      all.forEach(det => {
        det.addEventListener('toggle', () => {
          if (det.open) all.forEach(other => { if (other !== det) other.open = false; });
        });
      });
      const page = window.location.pathname.split('/').pop() || 'index.html';
      for (const a of document.querySelectorAll('#sidebar a')) {
        try {
          const u = new URL(a.href, window.location.href);
          if (u.pathname.split('/').pop() === page) { a.classList.add('active'); break; }
        } catch(e) {}
      }
    });
});

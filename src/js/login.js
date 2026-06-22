// Script halaman Login (login.html).

const form        = document.getElementById('loginForm');
const inputUser   = document.getElementById('username');
const inputPwd    = document.getElementById('password');
const kotakError  = document.getElementById('errorMsg');
const tombolMasuk = document.getElementById('submitBtn');
const labelTombol = document.getElementById('btnText');
const spinner     = document.getElementById('btnSpinner');

// Ikon mata: terbuka = password tampil, dicoret = password tersembunyi.
const IKON_MATA_TERBUKA  = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
const IKON_MATA_DICORET  = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>';

// Tombol mata: tampilkan / sembunyikan password.
document.getElementById('togglePwd').addEventListener('click', () => {
  const sedangTersembunyi = inputPwd.type === 'password';
  inputPwd.type = sedangTersembunyi ? 'text' : 'password';
  document.getElementById('eyeIcon').innerHTML = sedangTersembunyi ? IKON_MATA_DICORET : IKON_MATA_TERBUKA;
});

// Sembunyikan pesan error begitu user mulai mengetik lagi.
[inputUser, inputPwd].forEach(input => {
  input.addEventListener('input', () => {
    kotakError.classList.add('hidden');
    kotakError.classList.remove('flex');
  });
});

function tampilkanError(pesan) {
  const teks = document.getElementById('errorText');
  if (teks) teks.textContent = pesan;
  kotakError.classList.remove('hidden');
  kotakError.classList.add('flex');
}

// Atur tampilan tombol saat proses login berjalan / selesai.
function setTombolLoading(loading) {
  tombolMasuk.disabled = loading;
  labelTombol.textContent = loading ? 'Memproses...' : 'Masuk';
  spinner.classList.toggle('hidden', !loading);
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  setTombolLoading(true);

  const hasil = await authLogin(inputUser.value.trim(), inputPwd.value);

  if (hasil && hasil.ok) {
    localStorage.setItem('simanda_session', JSON.stringify({
      username: hasil.username,
      region:   hasil.region,
      _runId:   (window.electronAPI && window.electronAPI.runId) || '',
    }));
    window.location.replace('index.html');
    return;
  }

  // Kredensial salah → pesan generik; error lain (mis. jaringan) → tampilkan apa adanya.
  const error = (hasil && hasil.error) || '';
  tampilkanError(error && error !== 'INVALID_CREDENTIALS' ? error : 'Username atau password salah.');
  inputPwd.value = '';
  inputPwd.focus();
  setTombolLoading(false);
});

inputUser.focus();

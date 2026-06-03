const form       = document.getElementById('loginForm');
const errorMsg   = document.getElementById('errorMsg');
const pwdInput   = document.getElementById('password');
const togglePwd  = document.getElementById('togglePwd');
const btnText    = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const submitBtn  = document.getElementById('submitBtn');

togglePwd.addEventListener('click', () => {
  const isPassword = pwdInput.type === 'password';
  pwdInput.type = isPassword ? 'text' : 'password';
  document.getElementById('eyeIcon').innerHTML = isPassword
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
});

['username', 'password'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    errorMsg.classList.add('hidden');
    errorMsg.classList.remove('flex');
  });
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = pwdInput.value;

  submitBtn.disabled = true;
  btnText.textContent = 'Memproses...';
  btnSpinner.classList.remove('hidden');

  setTimeout(() => {
    const session = authLogin(username, password);
    if (session) {
      localStorage.setItem('simanda_session', JSON.stringify(session));
      window.location.replace('index.html');
    } else {
      errorMsg.classList.remove('hidden');
      errorMsg.classList.add('flex');
      pwdInput.value = '';
      pwdInput.focus();
      submitBtn.disabled = false;
      btnText.textContent = 'Masuk';
      btnSpinner.classList.add('hidden');
    }
  }, 300);
});

document.getElementById('username').focus();

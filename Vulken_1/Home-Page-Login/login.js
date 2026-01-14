// Show Sign-In Box
window.addEventListener('DOMContentLoaded', () => {
  // if already logged in, go to dashboard
  try {
    if (localStorage.getItem('vulkenAuth')) {
      window.location.href = '../Dashbord/index.html';
      return;
    }
  } catch (e) {}
  const signinBox = document.getElementById('signinBox');
  setTimeout(() => { signinBox.classList.add('show'); }, 200);

  // Canvas Background Animation
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const dotsCount = 120;
  const dots = Array.from({length:dotsCount}, () => ({
    x: Math.random()*width,
    y: Math.random()*height,
    radius: Math.random()*2 + 1,
    speed: Math.random()*0.5 + 0.2,
    dir: Math.random() > 0.5 ? 1 : -1
  }));

  function animateDots(){
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle = 'white';
    dots.forEach(d=>{
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI*2);
      ctx.fill();
      d.x += d.speed*d.dir;
      if(d.x>width) d.x=0;
      if(d.x<0) d.x=width;
    });
    requestAnimationFrame(animateDots);
  }
  animateDots();

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Forgot Password Modal
  const forgotLink = document.getElementById('forgotLink');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgot = document.getElementById('closeForgot');

  forgotLink.addEventListener('click', e => {
    e.preventDefault();
    forgotModal.classList.add('show');
  });

  closeForgot.addEventListener('click', () => forgotModal.classList.remove('show'));
  window.addEventListener('click', e => {
    if(e.target === forgotModal) forgotModal.classList.remove('show');
  });

  // Login form handling (simple client-side auth)
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = usernameInput.value.trim();
    const pass = passwordInput.value;
    // Accept two simple credential sets: admin/admin and user/user
    if (user === 'admin' && pass === 'admin') {
      try {
        localStorage.setItem('vulkenAuth', 'true');
        localStorage.setItem('vulkenRole', 'admin');
      } catch (err) { /* ignore */ }
      window.location.href = '../Dashbord/index.html';
      return;
    }

    if (user === 'user' && pass === 'user') {
      try {
        localStorage.setItem('vulkenAuth', 'true');
        localStorage.setItem('vulkenRole', 'user');
      } catch (err) { /* ignore */ }
      window.location.href = '../user/user.html';
      return;
    }

    // show a lightweight inline error for other credentials
    let errEl = document.getElementById('loginError');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'loginError';
      errEl.style.color = '#ff6b6b';
      errEl.style.marginTop = '10px';
      errEl.style.fontSize = '14px';
      document.getElementById('signinBox').appendChild(errEl);
    }
    errEl.textContent = 'Invalid username or password.';
  });
});
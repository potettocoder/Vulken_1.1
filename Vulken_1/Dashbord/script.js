document.addEventListener('DOMContentLoaded', () => {
    // simple auth guard: redirect to login if not authenticated
    try {
        const authed = localStorage.getItem('vulkenAuth');
        if (!authed) {
            // navigate up to Home-Page-Login
            window.location.href = '../Home-Page-Login/login.html';
            return;
        }
    } catch (err) {
        // if localStorage access fails, continue and allow the page (best effort)
    }
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, dpr;

    const dots = [];
    const numDots = 120;

    function resize() {
        // handle high-DPI displays
        dpr = window.devicePixelRatio || 1;
        width = Math.floor(window.innerWidth);
        height = Math.floor(window.innerHeight);

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initDots() {
        dots.length = 0;
        for (let i = 0; i < numDots; i++) {
            dots.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 1, // slightly faster
                speedY: (Math.random() - 0.5) * 1
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'white';

        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
            ctx.fill();

            dot.x += dot.speedX;
            dot.y += dot.speedY;

            // Wrap around edges
            if (dot.x > width) dot.x = 0;
            if (dot.x < 0) dot.x = width;
            if (dot.y > height) dot.y = 0;
            if (dot.y < 0) dot.y = height;
        });

        requestAnimationFrame(animate);
    }

    // initial setup
    resize();
    initDots();
    animate();

    // Add page fade-in class
    document.body.classList.add('fade-in');

    // Intercept sidebar link clicks and load workspace content dynamically
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    function isExternalHref(href) {
        return !href || href.startsWith('http') || href.startsWith('mailto:');
    }

    async function loadWorkspace(href, pushState = true) {
        try {
            const res = await fetch(href, {cache: 'no-store'});
            if (!res.ok) throw new Error('fetch-failed');
            const txt = await res.text();
            const parsed = new DOMParser().parseFromString(txt, 'text/html');
            const newMain = parsed.querySelector('.main-content');
            if (!newMain) {
                // fallback to full navigation if structure not found
                window.location.href = href;
                return;
            }

            const currentMain = document.querySelector('.main-content');
            if (!currentMain) { window.location.href = href; return; }

            // use the fetched page's H2 heading (if any) and replace main content
            const newH2 = newMain.querySelector('h2');

            // clone new children except its h2
            const newChildren = Array.from(newMain.childNodes).filter(n => !(n.nodeType === 1 && n.tagName.toLowerCase() === 'h2'));

            // animate transition on the main content area
            currentMain.classList.remove('fade-in');
            currentMain.classList.add('fade-out');

            setTimeout(() => {
                // clear and reconstruct
                currentMain.innerHTML = '';
                if (newH2) currentMain.appendChild(document.importNode(newH2, true));
                newChildren.forEach(n => currentMain.appendChild(document.importNode(n, true)));

                // update document title if provided by fetched page
                const newTitleEl = parsed.querySelector('title');
                if (newTitleEl) document.title = newTitleEl.textContent || document.title;

                // re-apply fade-in
                currentMain.classList.remove('fade-out');
                currentMain.classList.add('fade-in');

                // update active link styles (simple approach)
                sidebarLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));

                // update browser URL and history
                if (pushState) history.pushState({workspace: href}, '', href);
            }, 260);

        } catch (err) {
            // on any failure, fall back to full navigation
            window.location.href = href;
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (isExternalHref(href)) return; // let normal navigation happen
            e.preventDefault();

            // if it's an in-page anchor or '#', ignore
            if (href === '#' || href.startsWith('#')) return;

            // If link points to the current page, no-op
            const curPath = window.location.pathname.split('/').pop();
            if (href === curPath) return;

            // Load the workspace dynamically and preserve the main heading
            loadWorkspace(href, true);
        });
    });

    // Handle back/forward navigation to load appropriate workspace
    window.addEventListener('popstate', (e) => {
        const href = (e.state && e.state.workspace) || window.location.pathname.split('/').pop();
        if (href) loadWorkspace(href, false);
    });

    // profile-circle intentionally does not log out; use the Logout button instead

    // Profile dropdown and settings (admin)
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileModal = document.getElementById('profileModal');
    const openProfileSettings = document.getElementById('openProfileSettings');
    const profileNameInput = document.getElementById('profileName');
    const profileAvatarInput = document.getElementById('profileAvatar');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const closeProfileModal = document.getElementById('closeProfileModal');

    function loadProfile() {
        try {
            const raw = localStorage.getItem('vulkenProfile');
            return raw ? JSON.parse(raw) : { name: 'Admin', avatar: '' };
        } catch (e) { return { name: 'Admin', avatar: '' }; }
    }
    function saveProfile(p) { localStorage.setItem('vulkenProfile', JSON.stringify(p)); }

    function applyProfileToUI() {
        const p = loadProfile();
        const circle = document.querySelector('.profile-circle');
        if (!circle) return;
        if (p.avatar) {
            circle.style.backgroundImage = `url(${p.avatar})`;
            circle.style.backgroundSize = 'cover';
            circle.style.color = 'transparent';
            circle.textContent = '';
        } else {
            circle.style.backgroundImage = '';
            const initials = (p.name || 'Admin').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
            circle.textContent = initials || 'A';
            circle.style.color = '#012';
            circle.style.background = '#00adb5';
        }
    }

    applyProfileToUI();

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', () => { if (profileDropdown) profileDropdown.style.display = 'none'; });
    }

    if (openProfileSettings && profileModal) {
        openProfileSettings.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            const p = loadProfile();
            profileNameInput.value = p.name || '';
            profileAvatarInput.value = p.avatar || '';
            // reset any pending upload and show current avatar in preview
            pendingAvatarDataUrl = '';
            if (avatarPreview) {
                if (p.avatar) { avatarPreview.style.backgroundImage = `url(${p.avatar})`; avatarPreview.style.backgroundSize = 'cover'; }
                else { avatarPreview.style.backgroundImage = ''; }
            }
            profileModal.style.display = 'flex';
        });
    }

    // Avatar file upload handling (convert to data URL, small resize)
    const avatarFileInput = document.getElementById('profileAvatarFile');
    const avatarPreview = document.getElementById('avatarPreview');
    let pendingAvatarDataUrl = '';
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = new Image();
                img.onload = function() {
                    // resize to max 256px
                    const max = 256;
                    let w = img.width, h = img.height;
                    if (w > max || h > max) {
                        const ratio = Math.min(max / w, max / h);
                        w = Math.round(w * ratio); h = Math.round(h * ratio);
                    }
                    const cvs = document.createElement('canvas');
                    cvs.width = w; cvs.height = h;
                    const cc = cvs.getContext('2d');
                    cc.drawImage(img, 0, 0, w, h);
                    const dataUrl = cvs.toDataURL('image/png');
                    pendingAvatarDataUrl = dataUrl;
                    if (avatarPreview) { avatarPreview.style.backgroundImage = `url(${dataUrl})`; avatarPreview.style.backgroundSize = 'cover'; }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(f);
        });
    }

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });
    }
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const avatarVal = pendingAvatarDataUrl || profileAvatarInput.value.trim() || '';
            const newP = { name: profileNameInput.value.trim() || 'Admin', avatar: avatarVal };
            saveProfile(newP);
            applyProfileToUI();
            profileModal.style.display = 'none';
        });
    }

    // logout button (topbar)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            try { localStorage.removeItem('vulkenAuth'); } catch (e) {}
            document.body.classList.remove('fade-in');
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = '../Home-Page-Login/login.html'; }, 260);
        });
    }

    // Resize canvas on window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resize();
            initDots();
        }, 100);
    });
});

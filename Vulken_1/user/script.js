// Copied from Dashbord/script.js with path adjustments for login redirect
document.addEventListener('DOMContentLoaded', () => {
    // Simple auth guard: require 'vulkenAuth' in localStorage
    const authed = localStorage.getItem('vulkenAuth');
    if (!authed) {
        // redirect to login (relative path from user folder)
        window.location.href = '../Home-Page-Login/login.html';
        return;
    }

    // Canvas animated background (dots)
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let dots = [];

    function initDots() {
        dots = [];
        const count = Math.max(30, Math.floor((window.innerWidth + window.innerHeight) / 60));
        for (let i = 0; i < count; i++) {
            dots.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                r: 0.8 + Math.random() * 1.8
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (const d of dots) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < -10) d.x = window.innerWidth + 10;
            if (d.x > window.innerWidth + 10) d.x = -10;
            if (d.y < -10) d.y = window.innerHeight + 10;
            if (d.y > window.innerHeight + 10) d.y = -10;
        }
        requestAnimationFrame(animate);
    }

    let resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeCanvas();
            initDots();
        }, 120);
    }

    resizeCanvas();
    initDots();
    animate();
    window.addEventListener('resize', onResize);

    // Intercept sidebar links and load workspace content dynamically (preserve H2 from fetched page)
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    function isExternalHref(href) { return !href || href.startsWith('http') || href.startsWith('mailto:'); }

    async function loadWorkspace(href, pushState = true) {
        try {
            const res = await fetch(href, { cache: 'no-store' });
            if (!res.ok) throw new Error('fetch-failed');
            const txt = await res.text();
            const parsed = new DOMParser().parseFromString(txt, 'text/html');
            const newMain = parsed.querySelector('.main-content');
            if (!newMain) { window.location.href = href; return; }

            const currentMain = document.querySelector('.main-content');
            if (!currentMain) { window.location.href = href; return; }

            const newH2 = newMain.querySelector('h2');
            const newChildren = Array.from(newMain.childNodes).filter(n => !(n.nodeType === 1 && n.tagName.toLowerCase() === 'h2'));

            currentMain.classList.remove('fade-in');
            currentMain.classList.add('fade-out');

            setTimeout(() => {
                currentMain.innerHTML = '';
                if (newH2) currentMain.appendChild(document.importNode(newH2, true));
                newChildren.forEach(n => currentMain.appendChild(document.importNode(n, true)));

                const newTitleEl = parsed.querySelector('title');
                if (newTitleEl) document.title = newTitleEl.textContent || document.title;

                currentMain.classList.remove('fade-out');
                currentMain.classList.add('fade-in');

                sidebarLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
                if (pushState) history.pushState({workspace: href}, '', href);
            }, 260);
        } catch (err) {
            window.location.href = href;
        }
    }

    sidebarLinks.forEach(a => {
        a.addEventListener('click', e => {
            const href = a.getAttribute('href');
            if (href === '#' || href === '' || href === '#home') {
                e.preventDefault();
                // animate fade-out, then show dashboard cards and restore heading
                const currentMain = document.querySelector('.main-content');
                if (!currentMain) return;
                currentMain.classList.remove('fade-in');
                currentMain.classList.add('fade-out');

                setTimeout(() => {
                    document.querySelectorAll('.tickets-section').forEach(s => { s.style.display = 'none'; s.setAttribute('aria-hidden','true'); });
                    const cards = document.querySelectorAll('.cards, .below-cards');
                    cards.forEach(c => { c.style.display = ''; });
                    const h2 = currentMain.querySelector('h2');
                    if (h2) h2.textContent = 'Welcome to Vulken Dashboard';
                    currentMain.classList.remove('fade-out');
                    currentMain.classList.add('fade-in');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // push history for dashboard state
                    history.pushState({workspace: '#home'}, '', '#');
                }, 220);

                return;
            }

            if (href && href.startsWith('#')) {
                // internal anchor like #tickets — animate transition and update heading
                e.preventDefault();
                const targetId = href.slice(1);
                const target = document.getElementById(targetId);
                const currentMain = document.querySelector('.main-content');
                if (!target || !currentMain) return;

                currentMain.classList.remove('fade-in');
                currentMain.classList.add('fade-out');

                setTimeout(() => {
                    document.querySelectorAll('.tickets-section').forEach(s => { s.style.display = 'none'; s.setAttribute('aria-hidden','true'); });
                    target.style.display = 'block'; target.setAttribute('aria-hidden','false');
                    const cards = document.querySelectorAll('.cards, .below-cards');
                    cards.forEach(c => { c.style.display = 'none'; });
                    const h2 = currentMain.querySelector('h2');
                    if (h2) h2.textContent = 'Tickets';
                    currentMain.classList.remove('fade-out');
                    currentMain.classList.add('fade-in');
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // push history so Back/Forward works between dashboard/tickets
                    history.pushState({workspace: href}, '', href);
                }, 220);

                return;
            }

            if (isExternalHref(href)) return;
            e.preventDefault();
            loadWorkspace(href, true);
        });
    });

    window.addEventListener('popstate', (e) => {
        const href = (e.state && e.state.workspace) || window.location.pathname.split('/').pop();
        if (href) loadWorkspace(href, false);
    });

    // Tickets: load and render saved tickets
    const sentContainer = document.getElementById('sentTickets');
    function loadTickets() {
        const raw = localStorage.getItem('userTickets');
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }
    function saveTickets(list) { localStorage.setItem('userTickets', JSON.stringify(list)); }
    function renderTickets() {
        const list = loadTickets();
        sentContainer.innerHTML = '';
        if (!list.length) { sentContainer.innerHTML = '<div style="color:rgba(255,255,255,0.7)">No tickets sent yet.</div>'; return; }
        list.slice().reverse().forEach(t => {
            const el = document.createElement('div');
            el.className = 'ticket-box';
            el.innerHTML = `<div class="ticket-id">#${t.id}</div><div class="ticket-title">${escapeHtml(t.title)}</div><div class="ticket-meta">${t.time}</div><div style="margin-top:6px;color:rgba(255,255,255,0.85)">${escapeHtml(t.body)}</div>`;
            sentContainer.appendChild(el);
        });
    }

    // Update dashboard stats and recent updates panel
    function updateDashboardFromTickets() {
        const list = loadTickets();
        const sentCountEl = document.getElementById('tickets-sent-count');
        const repliedCountEl = document.getElementById('tickets-replied-count');
        const recentEl = document.getElementById('recentUpdates');
        if (sentCountEl) sentCountEl.textContent = list.length;
        // replies: assume a ticket has a `reply` field if replied
        const replied = list.filter(t => t.reply).length;
        if (repliedCountEl) repliedCountEl.textContent = replied;
        if (recentEl) {
            if (!list.length) { recentEl.innerHTML = '<div style="color:rgba(255,255,255,0.7)">No recent updates</div>'; }
            else {
                const items = list.slice().reverse().slice(0,6).map(t => {
                    const status = t.reply ? 'Replied' : 'Sent';
                    return `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>#${t.id}</strong> ${escapeHtml(t.title)} — <em style="color:rgba(255,255,255,0.7)">${status}</em><div style="font-size:13px;color:rgba(255,255,255,0.75)">${t.time}</div></div>`;
                }).join('');
                recentEl.innerHTML = items;
            }
        }
    }

    function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    renderTickets();
    updateDashboardFromTickets();

    // Handle ticket form submit
    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', e => {
            e.preventDefault();
            const title = document.getElementById('ticketTitle').value.trim();
            const body = document.getElementById('ticketBody').value.trim();
            if (!title || !body) return;
            const list = loadTickets();
            const id = (list.length ? list[list.length-1].id + 1 : 200);
            const time = new Date().toLocaleString();
            list.push({ id, title, body, time });
            saveTickets(list);
            renderTickets();
            updateDashboardFromTickets();
            ticketForm.reset();
            // show a brief confirmation
            const btn = document.getElementById('sendTicketBtn');
            const prev = btn.textContent;
            btn.textContent = 'Sent ✓';
            setTimeout(()=> btn.textContent = prev, 1400);
        });
    }

    // Logout button handling
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('vulkenAuth');
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = '../Home-Page-Login/login.html'; }, 220);
        });
    }

    // Profile dropdown and settings
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
            return raw ? JSON.parse(raw) : { name: 'User', avatar: '' };
        } catch (e) { return { name: 'User', avatar: '' }; }
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
            const initials = (p.name || 'User').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
            circle.textContent = initials || 'U';
            circle.style.color = '#fff';
            circle.style.background = 'var(--teal)';
        }
    }

    applyProfileToUI();

    // toggle dropdown
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        });
        // close on click outside
        document.addEventListener('click', () => { if (profileDropdown) profileDropdown.style.display = 'none'; });
    }

    // open settings modal
    if (openProfileSettings && profileModal) {
        openProfileSettings.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
            const p = loadProfile();
            profileNameInput.value = p.name || '';
            profileAvatarInput.value = p.avatar || '';
            // reset pending avatar and show current avatar in preview
            pendingAvatarDataUrl = '';
            if (avatarPreview) {
                if (p.avatar) { avatarPreview.style.backgroundImage = `url(${p.avatar})`; avatarPreview.style.backgroundSize = 'cover'; }
                else { avatarPreview.style.backgroundImage = ''; }
            }
            profileModal.style.display = 'flex';
        });
    }

    // Avatar file upload handling for user modal
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

    // (Dropdown logout removed - use the top Logout button instead)

    // modal close/save
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => { profileModal.style.display = 'none'; });
    }
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const avatarVal = pendingAvatarDataUrl || profileAvatarInput.value.trim() || '';
            const newP = { name: profileNameInput.value.trim() || 'User', avatar: avatarVal };
            saveProfile(newP);
            applyProfileToUI();
            profileModal.style.display = 'none';
        });
    }
});

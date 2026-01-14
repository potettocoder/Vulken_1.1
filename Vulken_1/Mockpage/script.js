// Mockpage script: canvas background + tickets handling (trimmed from user/script.js)
document.addEventListener('DOMContentLoaded', () => {
    // Canvas animated background (dots)
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
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

    // Tickets: load and render saved tickets
    const sentContainer = document.getElementById('sentTickets');
    function loadTickets() { const raw = localStorage.getItem('userTickets'); try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
    function saveTickets(list) { localStorage.setItem('userTickets', JSON.stringify(list)); }
    function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function renderTickets() {
        const list = loadTickets();
        if (!sentContainer) return;
        sentContainer.innerHTML = '';
        if (!list.length) { sentContainer.innerHTML = '<div style="color:rgba(255,255,255,0.7)">No tickets sent yet.</div>'; return; }
        list.slice().reverse().forEach(t => {
            const el = document.createElement('div');
            el.className = 'ticket-box';
            el.innerHTML = `<div class="ticket-id">#${t.id}</div><div class="ticket-title">${escapeHtml(t.title)}</div><div class="ticket-meta">${t.time}</div><div style="margin-top:6px;color:rgba(255,255,255,0.85)">${escapeHtml(t.body)}</div>`;
            sentContainer.appendChild(el);
        });
    }

    function updateDashboardFromTickets() {
        const list = loadTickets();
        const sentCountEl = document.getElementById('tickets-sent-count');
        const repliedCountEl = document.getElementById('tickets-replied-count');
        const recentEl = document.getElementById('recentUpdates');
        if (sentCountEl) sentCountEl.textContent = list.length;
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
            const btn = document.getElementById('sendTicketBtn');
            const prev = btn.textContent;
            btn.textContent = 'Sent ✓';
            setTimeout(()=> btn.textContent = prev, 1400);
        });
    }
});

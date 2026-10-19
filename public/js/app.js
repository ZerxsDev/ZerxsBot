/* ===== ZerxsBot Frontend Logic ===== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let TOKEN = localStorage.getItem('zx_token') || null;
let ME = null;
let pairTimer = null, pollTimer = null, currentPairBot = null;

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { 'x-token': TOKEN } : {}), ...(opts.headers || {}) },
  });
  if (res.status === 401) { logout(false); throw new Error('Sesi berakhir, login ulang.'); }
  return res.json();
}

function toast(msg, ok = true) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  t.style.borderColor = ok ? 'var(--ok)' : 'var(--danger)';
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Alur awal: spiral -> (login | video | app) ---------- */
window.addEventListener('DOMContentLoaded', async () => {
  tickClock(); setInterval(tickClock, 1000);
  setTimeout(async () => {
    $('#loader-spiral').classList.add('hidden');
    if (TOKEN) {
      try {
        const r = await apiFetch('/api/me');
        if (r.ok) { showVideoThenApp(); return; }
      } catch (e) {}
    }
    $('#view-login').classList.remove('hidden');
  }, 2200);
  bindUI();
});

function tickClock() {
  const d = new Date();
  const jam = $('#live-clock'); if (!jam) return;
  jam.textContent = d.toLocaleTimeString('id-ID');
  $('#live-date').textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---------- Video loading + skip ---------- */
function showVideoThenApp() {
  $('#view-video').classList.remove('hidden');
  const v = $('#intro-video');
  const done = () => { $('#view-video').classList.add('hidden'); enterApp(); };
  v.onended = done;
  v.onerror = done; // jika file video belum ada, langsung masuk beranda tanpa error
  $('#btn-skip').onclick = () => { v.pause(); done(); };
  v.play().catch(() => done());
}

async function enterApp() {
  const r = await apiFetch('/api/me');
  if (!r.ok) return logout(true);
  ME = r.user;
  $('#view-app').classList.remove('hidden');
  paintUser();
  loadGlobalInfo();
  loadBots();
  if (ME.role === 'developer') $$('.dev-only').forEach(el => el.classList.remove('hidden'));
  else $$('.dev-only').forEach(el => el.classList.add('hidden'));
}

function paintUser() {
  $('#ui-name').textContent = ME.nama || ME.username;
  $('#ui-phone').textContent = '+62 ' + String(ME.phone).replace(/^62/, '');
  $('#ui-expired').textContent = ME.expired ? 'Expired: ' + new Date(ME.expired).toLocaleDateString('id-ID') : 'Expired: Permanen ♾️';
  $('#side-role').textContent = ME.role.toUpperCase();
  $('#bm-role').textContent = ME.role.toUpperCase();
  $('#pf-avatar').textContent = (ME.nama || ME.username)[0].toUpperCase();
  $('#pf-name').textContent = ME.nama || ME.username;
  $('#pf-role').textContent = 'Role: ' + ME.role.toUpperCase();
  $('#pf-expired').textContent = ME.expired ? 'Masa aktif s/d ' + new Date(ME.expired).toLocaleDateString('id-ID') : 'Masa aktif: Permanen';
}

function logout(callApi = true) {
  if (callApi && TOKEN) apiFetch('/api/logout', { method: 'POST' }).catch(() => {});
  TOKEN = null; ME = null; localStorage.removeItem('zx_token');
  location.reload();
}

/* ---------- Bind UI ---------- */
function bindUI() {
  // password eye
  $('#btn-eye').onclick = () => {
    const p = $('#in-password');
    p.type = p.type === 'password' ? 'text' : 'password';
  };
  // login
  $('#form-login').onsubmit = async (e) => {
    e.preventDefault();
    const m = $('#login-msg'); m.textContent = 'Memverifikasi ke spreadsheet...'; m.className = 'msg';
    const phone = '+62' + $('#in-phone').value.replace(/\D/g, '');
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('#in-username').value.trim(), password: $('#in-password').value, phone }) }).then(x => x.json());
    if (!r.ok) { m.textContent = r.message || 'Login gagal.'; return; }
    TOKEN = r.token; localStorage.setItem('zx_token', TOKEN); ME = r.user;
    $('#view-login').classList.add('hidden');
    showVideoThenApp();
  };
  // beli akses
  $('#btn-buy').onclick = async () => {
    const r = await apiFetch('/api/pricing');
    const box = $('#price-list'); box.innerHTML = '';
    const benefits = {
      member: ['Kuota 8 chat/hari', '1 nomor bot', '/ai /stickertext /brat /bratvid /iqc /info /menu /tutor', 'Trial 1 bulan'],
      permanen: ['Kuota 8 chat/hari', '1 nomor bot', 'Perintah member selamanya'],
      admin: ['Kuota 16 chat/hari', '3 nomor bot', '+ /sticker /quotes /kurs /meme /translate'],
      partner: ['Kuota 35 chat/hari', '5 nomor bot', '+ /coder /imageai /qrcode /send /hash /biner'],
      owner: ['Kuota 100 chat/hari', '10 nomor bot', 'Semua perintah + ganti prefix ( / . ! )'],
      business: ['Kuota 100 chat/hari', '20 nomor bot', 'Semua perintah personal + BOT CS (GPT-4o-mini) + prompt AI custom'],
      developer: ['Kuota UNLIMITED', 'Bot UNLIMITED', 'Semua perintah + grup + CS + menu developer (create akun 8x/minggu)', 'Prefix multi: / . ! # ? >'],
    };
    (r.roles || []).forEach(role => {
      const div = document.createElement('div'); div.className = 'price-card';
      div.innerHTML = `<h4>${role.label}</h4><div class="price">Rp ${role.price.toLocaleString('id-ID')}</div>
        <ul>${(benefits[role.key] || []).map(b => `<li>${b}</li>`).join('')}</ul>
        <button class="btn btn-primary sm" data-tg="${role.telegram}"><i class="fa-brands fa-telegram"></i> BELI AKSES</button>`;
      box.appendChild(div);
    });
    box.querySelectorAll('button').forEach(b => b.onclick = () => window.open(b.dataset.tg, '_blank'));
    $('#modal-price').classList.remove('hidden');
  };
  $('#btn-close-price').onclick = () => $('#modal-price').classList.add('hidden');
  $('#tg-link').href = '#'; 
  apiFetch('/api/telegram').then(r => { if (r.ok) $('#tg-link').href = r.url; }).catch(()=>{});

  // sidebar & navigasi
  $('#btn-menu').onclick = () => $('#sidebar').classList.toggle('open');
  $$('.side-link').forEach(a => a.onclick = () => {
    $$('.side-link').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const page = a.dataset.page;
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#page-' + page).classList.remove('hidden');
    $('#topbar-title').textContent = a.textContent.trim();
    $('#sidebar').classList.remove('open');
    if (page === 'fitur') loadFeatures();
    if (page === 'botmanager') loadBots();
    if (page === 'developer') loadDevStats();
    if (page === 'beranda') loadGlobalInfo();
  });
  $('#btn-logout').onclick = () => logout();

  // bot manager
  $('#btn-add-bot').onclick = () => { $('#nb-msg').textContent=''; $('#modal-bot').classList.remove('hidden'); };
  $('#nb-cancel').onclick = () => $('#modal-bot').classList.add('hidden');
  $('#nb-type').onchange = () => $('#cs-extra').classList.toggle('hidden', $('#nb-type').value !== 'cs');
  $('#nb-save').onclick = async () => {
    const m = $('#nb-msg'); m.textContent = 'Menyimpan ke spreadsheet & menjalankan bot...';
    const num = '62' + $('#nb-number').value.replace(/\D/g, '').replace(/^62/, '');
    const r = await apiFetch('/api/bots/add', { method: 'POST', body: JSON.stringify({
      botNumber: num, botName: $('#nb-name').value || 'ZerxsBot', botType: $('#nb-type').value,
      csPrompt: $('#nb-csprompt').value, businessName: $('#nb-bname').value,
      businessDesc: $('#nb-bdesc').value, businessProducts: $('#nb-bprod').value,
    })});
    if (!r.ok) { m.className='msg'; m.textContent = r.message; return; }
    $('#modal-bot').classList.add('hidden'); toast('Bot ditambahkan! Lakukan pairing.'); loadBots();
    openPairing(num);
  };
  $('#btn-del-bot').onclick = () => { toast('Klik ikon 🗑 pada kartu bot untuk menghapus.', false); };

  // pairing modal
  $('#pair-close').onclick = () => { clearInterval(pairTimer); $('#modal-pair').classList.add('hidden'); };
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
    $('#tab-qr').classList.toggle('hidden', t.dataset.tab !== 'qr');
    $('#tab-code').classList.toggle('hidden', t.dataset.tab !== 'code');
  });
  $('#pc-request').onclick = async () => {
    const phone = '62' + $('#pc-phone').value.replace(/\D/g, '').replace(/^62/, '');
    const m = $('#pair-status'); m.textContent = 'Meminta kode pairing...'; m.className='msg';
    const r = await apiFetch('/api/pair/code', { method: 'POST', body: JSON.stringify({ botNumber: currentPairBot, phoneNumber: phone }) });
    if (r.ok) { $('#pc-code').textContent = r.code; m.textContent = 'Masukkan kode di HP Anda.'; m.className = 'msg ok'; }
    else { m.textContent = r.message; m.className = 'msg'; }
  };

  // profil - ganti password
  $('#btn-show-pwform').onclick = () => $('#form-pw').classList.toggle('hidden');
  $('#form-pw').onsubmit = async (e) => {
    e.preventDefault();
    const m = $('#pw-msg');
    const r = await apiFetch('/api/change-password', { method: 'POST', body: JSON.stringify({ oldPassword: $('#pw-old').value, newPassword: $('#pw-new').value }) });
    m.className = 'msg' + (r.ok ? ' ok' : ''); m.textContent = r.message || (r.ok ? 'Password diubah.' : 'Gagal');
    if (r.ok) { $('#pw-old').value = $('#pw-new').value = ''; toast('Password berhasil diganti.'); }
  };

  // developer create account
  $('#form-dev').onsubmit = async (e) => {
    e.preventDefault();
    const m = $('#dv-msg'); m.textContent = 'Mengirim ke spreadsheet...';
    const r = await apiFetch('/api/dev/create-account', { method: 'POST', body: JSON.stringify({
      username: $('#dv-username').value.trim(), password: $('#dv-password').value,
      role: $('#dv-role').value, phone: $('#dv-phone').value }) });
    m.className = 'msg' + (r.ok ? ' ok' : ''); m.textContent = r.message;
    if (r.ok) { toast('Akun dibuat!'); loadDevStats(); $('#dv-username').value=$('#dv-password').value=''; }
  };
}

/* ---------- Data loaders ---------- */
async function loadGlobalInfo() {
  try {
    const g = await apiFetch('/api/global-info');
    $('#c-users').textContent = g.totalUsers ?? 0;
    $('#c-accounts').textContent = g.totalUsers ?? 0;
    $('#c-bots').textContent = g.activeBots ?? 0;
    $('#side-counter').textContent = g.activeBots ?? 0;
    const st = $('#global-status');
    st.className = 'status-dot ' + (g.botStatus === 'online' ? 'online' : 'offline');
    st.querySelector('b').textContent = g.botStatus.toUpperCase();
    $('#c-status').textContent = g.botStatus.toUpperCase();
  } catch (e) {}
}

async function loadBots() {
  const r = await apiFetch('/api/bots');
  const box = $('#bot-list'); box.innerHTML = '';
  $('#bm-sheet').textContent = r.ok ? 'ONLINE' : 'ERROR';
  if (!r.ok) return;
  let active = 0;
  r.bots.forEach(b => {
    const rt = b.runtime?.status || b.status || 'offline';
    if (rt === 'online') active++;
    const div = document.createElement('div'); div.className = 'bot-item';
    div.innerHTML = `
      <b>+62 ${String(b.botNumber).replace(/^62/, '')}</b>
      <span class="dim">Nama: ${b.botName || 'ZerxsBot'} • Jenis: ${(b.botType||'biasa').toUpperCase()}</span>
      <span class="st ${rt}">● ${rt.toUpperCase()}</span>
      <span class="dim">Ditambahkan: ${b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : '-'}</span>
      ${b.businessName ? `<span class="dim">Bisnis: ${b.businessName}</span>` : ''}
      <div class="bot-actions">
        <button class="btn btn-ghost sm" data-act="pair"><i class="fa-solid fa-link"></i> Pairing</button>
        <button class="btn btn-danger sm" data-act="del"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    div.querySelector('[data-act=pair]').onclick = () => openPairing(b.botNumber);
    div.querySelector('[data-act=del]').onclick = async () => {
      if (!confirm('Hapus bot +' + b.botNumber + ' dari spreadsheet?')) return;
      const rr = await apiFetch('/api/bots/remove', { method: 'POST', body: JSON.stringify({ botNumber: b.botNumber }) });
      toast(rr.message || (rr.ok ? 'Bot dihapus.' : 'Gagal'), rr.ok); loadBots();
    };
    box.appendChild(div);
  });
  $('#bm-active').textContent = active;
  $('#side-counter').textContent = active;
}

async function openPairing(botNumber) {
  currentPairBot = botNumber;
  $('#pair-num').textContent = '+' + botNumber;
  $('#pc-code').textContent = '------';
  $('#pair-status').textContent = 'Menghubungkan...'; $('#pair-status').className = 'msg';
  $('#modal-pair').classList.remove('hidden');
  apiFetch('/api/pair/qr', { method: 'POST', body: JSON.stringify({ botNumber }) });
  clearInterval(pairTimer);
  pairTimer = setInterval(async () => {
    const s = await apiFetch('/api/pair/status/' + botNumber);
    if (s.qr) { $('#qr-img').src = s.qr; $('#pair-status').textContent = 'Pindai QR atau gunakan pairing code.'; }
    if (s.pairingCode) $('#pc-code').textContent = s.pairingCode;
    if (s.status === 'online') {
      clearInterval(pairTimer);
      $('#pair-status').textContent = '✅ Bot berhasil terhubung!'; $('#pair-status').className = 'msg ok';
      toast('Bot online!'); loadBots(); loadGlobalInfo();
      setTimeout(() => $('#modal-pair').classList.add('hidden'), 1800);
    }
    if (s.status === 'none' || s.status === 'error') $('#pair-status').textContent = 'Bot tidak ditemukan / error, tambah ulang bot.';
  }, 2000);
}

async function loadFeatures() {
  const f = await apiFetch('/api/features');
  if (!f.ok) return;
  $('#feature-quota').innerHTML = `Role <b>${f.role.toUpperCase()}</b> — Kuota harian: <b>${f.quota}</b> chat • Maksimal bot: <b>${f.maxBots}</b>
    ${f.groupAccess ? '• ✅ Akses perintah grup' : ''} ${f.csAccess ? '• ✅ Bisa buat Bot CS' : ''}`;
  const box = $('#feature-list'); box.innerHTML = '';
  (f.commands || []).forEach(c => {
    const d = document.createElement('div'); d.className = 'feat';
    d.innerHTML = `<code>/${c}</code>`;
    box.appendChild(d);
  });
}

async function loadDevStats() {
  const r = await apiFetch('/api/dev/stats');
  if (!r.ok) { toast(r.message || 'Akses ditolak', false); return; }
  $('#dv-total').textContent = r.total || 0;
  const box = $('#dv-roles'); box.innerHTML = '';
  Object.entries(r.roles || {}).forEach(([role, n]) => {
    const d = document.createElement('div'); d.className = 'chip';
    d.innerHTML = `<b style="color:var(--cyan)">${role.toUpperCase()}</b>: ${n} akun`;
    box.appendChild(d);
  });
}

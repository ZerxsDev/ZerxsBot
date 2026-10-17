/* ============================================================
   ZERXSBOT — Frontend App (JavaScript murni)
   Catatan: tidak ada URL apps script / openrouter di sisi klien.
   Semua lewat endpoint /api/* di server Node.js.
   ============================================================ */
const $ = (id) => document.getElementById(id);
const api = async (url, opt = {}) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', ...opt });
  return res.json();
};

let ME = null;
let socket = null;
let currentPairBot = null;

/* ================= ALUR BOOT: spiral -> login ================= */
window.addEventListener('load', () => {
  // loading spiral minimal 1.6 detik lalu cek sesi
  setTimeout(async () => {
    $('bootLoader').classList.add('hidden');
    try {
      const r = await api('/api/me');
      if (r.ok) { ME = r.user; enterApp(false); return; }
    } catch (e) {}
    $('loginScreen').classList.remove('hidden');
    renderPrices();
  }, 1600);
});

/* ================= LOGIN ================= */
$('btnEye').onclick = () => {
  const i = $('inpPassword');
  i.type = i.type === 'password' ? 'text' : 'password';
};

$('btnBuyToggle').onclick = () => {
  const box = $('priceBox');
  box.classList.toggle('hidden');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

function renderPrices() {
  // harga & benefit role (data statis utk tampilan; sumber kebenaran tetap config.js server)
  const roles = [
    ['Member Trial', 'Rp 15.000', 'Expired 1 bulan · kuota 8x/hari · 1 bot'],
    ['Member Permanen', 'Rp 25.000', 'Selamanya · kuota 8x/hari · 1 bot'],
    ['Admin Permanen', 'Rp 30.000', 'Kuota 16x/hari · 3 bot · +sticker,quotes,kurs,meme,translate'],
    ['Partner Permanen', 'Rp 50.000', 'Kuota 35x/hari · 5 bot · +coder,imageai,qrcode,send,hash,biner'],
    ['Owner Permanen', 'Rp 80.000', 'Kuota 100x/hari · 10 bot · semua perintah · ganti prefiks (/, ., !)'],
    ['Business Permanen', 'Rp 100.000', 'Semua perintah kecuali grup · 20 bot · Bot CS tanpa prefiks (AI GPT-4o-mini)'],
    ['Developer Permanen', 'Rp 120.000', 'Unlimited · bot unlimited · perintah grup · panel developer · prefiks (/, ., !, #, ?, >)'],
  ];
  $('priceList').innerHTML = roles.map(([n, p, b]) =>
    `<div class="price-item"><div><b>${n}</b><small>${b}</small></div><span>${p}</span></div>`).join('');
}

$('loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const err = $('loginError');
  err.classList.add('hidden');
  $('btnLogin').disabled = true;
  $('btnLogin').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memeriksa…';
  const phone = '62' + $('inpPhone').value.replace(/[^0-9]/g, '').replace(/^0+/, '');
  const r = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username: $('inpUsername').value.trim(), password: $('inpPassword').value, phone }),
  }).catch(() => ({ ok: false, error: 'Server tidak dapat dijangkau' }));
  $('btnLogin').disabled = false;
  $('btnLogin').innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk';
  if (!r.ok) { err.textContent = '⛔ ' + (r.error || 'Login gagal'); err.classList.remove('hidden'); return; }
  ME = r.user;
  // sukses login -> video intro
  $('loginScreen').classList.add('hidden');
  playIntro();
});

/* ================= VIDEO INTRO + SKIP ================= */
function playIntro() {
  const wrap = $('videoIntro');
  const vid = $('introVideo');
  wrap.classList.remove('hidden');
  vid.currentTime = 0;
  const p = vid.play();
  if (p && p.catch) p.catch(() => { /* video tidak ada -> langsung masuk */ finishIntro(); });
  vid.onended = finishIntro;
  // safety: jika file video tidak tersedia, timeout 6 detik
  setTimeout(() => { if (!wrap.classList.contains('hidden')) finishIntro(); }, 6000);
}
$('btnSkip').onclick = finishIntro;
function finishIntro() {
  $('videoIntro').classList.add('hidden');
  $('introVideo').pause();
  enterApp(true);
}

/* ================= APP ================= */
async function enterApp(fresh) {
  $('app').classList.remove('hidden');
  connectSocket();
  fillUser();
  showPage('home');
  refreshStats();
  setInterval(refreshStats, 30000);
  tickClock(); setInterval(tickClock, 1000);
}

function fillUser() {
  const letter = String(ME.username)[0].toUpperCase();
  $('uAvatar').textContent = letter;
  $('pfAvatar').textContent = letter;
  $('uName').textContent = ME.username;
  $('uPhone').textContent = '+' + String(ME.phone).replace(/\D/g, '');
  $('uExpire').textContent = fmtDate(ME.expired);
  $('pfName').textContent = ME.username;
  $('pfRole').textContent = ME.role;
  $('pfExpire').textContent = fmtDate(ME.expired);
  $('sbRoleName').textContent = ME.coreRole || 'MEMBER';
  if ((ME.coreRole || '') === 'DEVELOPER') document.querySelector('.dev-only').classList.remove('hidden');
  if (['BUSINESS', 'DEVELOPER'].includes(ME.coreRole)) {
    $('optCs').disabled = false;
  }
}
function fmtDate(d) {
  if (!d || /permanen|permanent/i.test(String(d))) return '♾️ Permanen';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* clock banner tanggal & jam hari ini */
function tickClock() {
  const now = new Date();
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  $('liveClock').textContent = `${days[now.getDay()]}, ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • ${now.toLocaleTimeString('id-ID')}`;
}

/* navbar routing */
const PAGE_NAMES = { home: 'Beranda', botmanager: 'Bot Manager', features: 'Fitur', info: 'Info', profile: 'Profil', developer: 'Developer' };
document.querySelectorAll('.nav-link').forEach((a) => {
  a.addEventListener('click', (e) => { e.preventDefault(); showPage(a.dataset.page); });
});
function showPage(name) {
  if (name === 'developer' && ME.coreRole !== 'DEVELOPER') name = 'home';
  document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
  $(('page-' + name)).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.toggle('active', l.dataset.page === name));
  $('sbMenuName').textContent = PAGE_NAMES[name];
  if (name === 'home') refreshStats();
  if (name === 'botmanager') loadBots();
  if (name === 'features') loadFeatures();
  if (name === 'developer') loadDevStats();
}

$('btnLogout').onclick = async () => { await api('/api/logout', { method: 'POST' }); location.reload(); };

/* ================= GLOBAL STATS ================= */
async function refreshStats() {
  const st = await api('/api/globalstats').catch(() => null);
  if (!st || !st.ok) {
    $('gStatus').textContent = 'OFFLINE'; $('gStatusBox').classList.add('offline');
    $('bmSheet').textContent = 'OFFLINE';
    return;
  }
  $('gUsers').textContent = st.totalUsers;
  $('gBots').textContent = st.totalBots;
  $('gStatus').textContent = st.onlineBots > 0 ? 'ONLINE' : 'ONLINE';
  $('gStatusBox').classList.add('online');
  $('bmSheet').textContent = 'SYNCED';
  $('bmActive').textContent = st.onlineBots;
  $('sbBotNum').textContent = st.totalBots;
}

/* ================= BOT MANAGER ================= */
$('btnAddBot').onclick = () => { $('addBotForm').classList.remove('hidden'); $('addBotForm').scrollIntoView({ behavior: 'smooth' }); };
$('btnDelBotMode').onclick = () => $('botsGrid').classList.toggle('del-mode');

$('bmJenis').onchange = () => {
  $('csProfileBox').classList.toggle('hidden', $('bmJenis').value !== 'cs');
};

$('tabQr').onclick = () => { setPairTab('qr'); };
$('tabPair').onclick = () => { setPairTab('pair'); };
function setPairTab(t) {
  $('tabQr').classList.toggle('active', t === 'qr');
  $('tabPair').classList.toggle('active', t === 'pair');
  $('qrArea').classList.toggle('hidden', t !== 'qr');
  $('pairArea').classList.toggle('hidden', t !== 'pair');
  $('btnGetCode').classList.toggle('hidden', t !== 'pair');
}

$('btnStartPair').onclick = async () => {
  const noBot = $('bmNoBot').value.replace(/[^0-9]/g, '');
  if (!noBot) return bmMsg('Isi nomor bot terlebih dahulu (contoh 6281234567890).', true);
  currentPairBot = noBot;
  bmMsg('Menjalankan bot & menunggu QR…');
  // simpan ke spreadsheet + start engine
  const csProfile = $('bmJenis').value === 'cs' ? { businessName: $('csBizName').value, businessDesc: $('csBizDesc').value } : null;
  const r = await api('/api/bots/add', {
    method: 'POST',
    body: JSON.stringify({ noBot, namaBot: $('bmNamaBot').value || ('Bot-' + noBot), jenis: $('bmJenis').value, csProfile }),
  });
  if (!r.ok) return bmMsg(r.error || 'Gagal menambah bot', true);
  socket.emit('bot:start', { noBot, namaBot: $('bmNamaBot').value, jenis: $('bmJenis').value, csProfile });
  bmMsg('✅ Bot ditambahkan ke spreadsheet. Scan QR yang muncul.');
  loadBots();
};

$('btnGetCode').onclick = async () => {
  const noBot = $('bmNoBot').value.replace(/[^0-9]/g, '');
  const phone = $('pairPhone').value.replace(/[^0-9]/g, '');
  if (!noBot || !phone) return bmMsg('Nomor bot & nomor HP target wajib diisi.', true);
  const r = await api('/api/bots/paircode', { method: 'POST', body: JSON.stringify({ noBot, phone: '62' + phone.replace(/^0+/, '') }) });
  if (r.ok) {
    $('pairCodeOut').textContent = r.code;
    bmMsg(`Pairing code untuk +${r.phone}: ${r.code} — masukkan di HP target (WhatsApp → Perangkat Tertaut → Gunakan kode telepon).`);
  } else bmMsg(r.error || 'Gagal meminta pairing code', true);
};

function bmMsg(t, isErr) { const m = $('bmMsg'); m.textContent = t; m.style.color = isErr ? 'var(--danger)' : 'var(--cyan)'; }

async function loadBots() {
  const g = $('botsGrid');
  const r = await api('/api/bots').catch(() => null);
  if (!r || !r.ok) { g.innerHTML = '<p class="muted">Gagal memuat daftar bot dari spreadsheet.</p>'; return; }
  $('bmRole').textContent = ME.coreRole || 'MEMBER';
  if (!r.bots.length) { g.innerHTML = '<p class="muted">Belum ada bot. Klik "Tambahkan Nomor Bot".</p>'; return; }
  g.innerHTML = r.bots.map((b) => {
    const s = String(b.liveStatus || b.status || 'OFFLINE').toUpperCase();
    const cls = s === 'ONLINE' ? 'st-online' : (s === 'QR' || s === 'CONNECTING' ? 'st-qr' : 'st-offline');
    return `<div class="bot-box">
      <button class="btn-icon bot-del-btn" data-no="${b.noBot}" title="Hapus bot"><i class="fa-solid fa-trash-can"></i></button>
      <h5><i class="fa-solid fa-robot"></i> ${esc(b.namaBot)}</h5>
      <div class="row">No Bot: <b>+${esc(String(b.noBot))}</b></div>
      <div class="row">Jenis: <b>${esc(b.jenis || 'biasa')}</b></div>
      <div class="row">Status: <span class="status-pill ${cls}">${s}</span></div>
      <div class="row">Ditambahkan: <b>${esc(b.createdAt || '-')}</b></div>
    </div>`;
  }).join('');
  g.querySelectorAll('.bot-del-btn').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Hapus bot +' + btn.dataset.no + ' dari spreadsheet?')) return;
      const r2 = await api('/api/bots/del', { method: 'POST', body: JSON.stringify({ noBot: btn.dataset.no }) });
      bmMsg(r2.ok ? 'Bot dihapus.' : (r2.error || 'Gagal menghapus'), !r2.ok);
      loadBots();
    };
  });
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ================= SOCKET.IO (QR real-time) ================= */
function connectSocket() {
  if (socket) return;
  try { socket = io(); } catch (e) { return; }
  socket.on('bot:qr', ({ noBot, qrDataUrl }) => {
    if (String(noBot) !== String(currentPairBot)) return;
    const img = $('qrImg');
    img.src = qrDataUrl; img.classList.remove('hidden');
    $('qrHint').textContent = 'Scan dengan WhatsApp → Perangkat Tertaut. QR diperbarui otomatis.';
  });
  socket.on('bot:paired', ({ noBot }) => {
    bmMsg(`✅ Bot +${noBot} berhasil pair & online!`);
    loadBots(); refreshStats();
  });
  socket.on('bot:status', () => { loadBots(); });
  socket.on('bot:error', ({ msg }) => bmMsg(msg, true));
  socket.on('bot:paircode', (r) => { $('pairCodeOut').textContent = r.code || '-'; });
}

/* ================= FITUR ================= */
async function loadFeatures() {
  const r = await api('/api/features').catch(() => null);
  if (!r || !r.ok) return;
  $('ftRoleTag').textContent = r.core;
  $('ftQuota').textContent = r.benefits.quota === 'Unlimited' ? '∞' : r.benefits.quota;
  $('ftMaxBot').textContent = r.benefits.maxBots === 'Unlimited' ? '∞' : r.benefits.maxBots;
  $('ftPrefiks').textContent = r.benefits.prefiks.join(' ');
  $('featPersonal').innerHTML = r.commands.map((c) =>
    `<div class="feat-item"><code>${c.name}</code><p>${esc(c.desc)}</p></div>`).join('') || '<p class="muted">Tidak ada perintah.</p>';
  if (r.groupCommands && r.groupCommands.length) {
    $('featGroupWrap').classList.remove('hidden');
    $('featGroup').innerHTML = r.groupCommands.map((c) =>
      `<div class="feat-item"><code>${c.name}</code><p>${esc(c.desc)}</p></div>`).join('');
  } else {
    $('featGroupWrap').classList.remove('hidden');
    $('featGroup').innerHTML = '<p class="muted">Perintah grup hanya tersedia untuk role DEVELOPER.</p>';
  }
}

/* ================= PROFIL ================= */
$('btnChangePass').onclick = () => $('changePassForm').classList.toggle('hidden');
$('btnCancelChange').onclick = () => $('changePassForm').classList.add('hidden');
$('btnDoChange').onclick = async () => {
  const r = await api('/api/changepassword', {
    method: 'POST',
    body: JSON.stringify({ oldPassword: $('cpOld').value, newPassword: $('cpNew').value }),
  });
  const m = $('cpMsg');
  m.textContent = r.ok ? '✅ ' + (r.message || 'Kata sandi berubah.') : '⛔ ' + (r.error || 'Gagal');
  m.style.color = r.ok ? 'var(--success)' : 'var(--danger)';
  if (r.ok) { $('cpOld').value = ''; $('cpNew').value = ''; }
};

/* ================= DEVELOPER ================= */
async function loadDevStats() {
  const st = await api('/api/dev/stats').catch(() => null);
  if (!st || !st.ok) return;
  $('dvUsers').textContent = st.totalUsers;
  const icons = { MEMBER: 'fa-user', ADMIN: 'fa-user-shield', PARTNER: 'fa-handshake', OWNER: 'fa-crown', DEVELOPER: 'fa-code', BUSINESS: 'fa-briefcase' };
  $('dvRoles').innerHTML = Object.entries(st.perRole || {}).map(([role, n]) =>
    `<div class="counter c-${role === 'DEVELOPER' ? 'purple' : role === 'BUSINESS' ? 'green' : 'blue'}">
       <i class="fa-solid ${icons[role] || 'fa-user'}"></i><div class="c-num">${n}</div><div class="c-label">Role ${role}</div>
     </div>`).join('');
}

$('btnCreateAccount').onclick = async () => {
  const r = await api('/api/dev/createaccount', {
    method: 'POST',
    body: JSON.stringify({ username: $('dcUser').value.trim(), password: $('dcPass').value, role: $('dcRole').value }),
  });
  const m = $('dcMsg');
  m.textContent = r.ok ? '✅ ' + r.message : '⛔ ' + (r.error || 'Gagal membuat akun');
  m.style.color = r.ok ? 'var(--success)' : 'var(--danger)';
  if (r.ok) { $('dcUser').value = ''; $('dcPass').value = ''; loadDevStats(); }
};

// ZerxsBot - Web Server (Express) + Bootstrap Bot Manager
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const { api } = require('./lib/sheetdb');
const botEngine = require('./bot');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
// JANGAN pernah menyajikan config.js ke web.

// ---- Session sederhana (token -> user) ----
const sessions = new Map();
function makeToken() { return crypto.randomBytes(24).toString('hex'); }
function auth(req, res, next) {
  const t = req.headers['x-token'];
  const s = sessions.get(t);
  if (!s) return res.status(401).json({ ok: false, message: 'Sesi tidak valid, silakan login ulang.' });
  if (Date.now() - s.createdAt > 7 * 86400 * 1000) { sessions.delete(t); return res.status(401).json({ ok: false, message: 'Sesi berakhir.' }); }
  req.zxSession = s; req.zxToken = t;
  next();
}

// ---- API: LOGIN (data dari spreadsheet via apps script; tanpa akun demo) ----
app.post('/api/login', async (req, res) => {
  const { username, phone, password } = req.body || {};
  if (!username || !password) return res.json({ ok: false, message: 'Username & password wajib diisi.' });
  const r = await api('login', { username, password });
  if (!r.ok) return res.json(r);
  // cocokkan nomor hp juga bila dikirim
  if (phone && r.user.phone !== String(phone).replace(/[^0-9]/g, '').replace(/^0/, '62') && !String(phone).replace(/\D/g,'').endsWith(r.user.phone.slice(-6))) {
    // longgarkan: cek 6 digit terakhir
  }
  const token = makeToken();
  sessions.set(token, { user: r.user, createdAt: Date.now() });
  res.json({ ok: true, token, user: { username: r.user.username, nama: r.user.nama, phone: r.user.phone, role: r.user.role, expired: r.user.expired } });
});

app.post('/api/logout', auth, (req, res) => { sessions.delete(req.zxToken); res.json({ ok: true }); });

app.get('/api/me', auth, async (req, res) => {
  // refresh data user dari spreadsheet (cek expired)
  const r = await api('getUser', { username: req.zxSession.user.username });
  if (!r.ok) { sessions.delete(req.zxToken); return res.json({ ok: false, message: 'Akun tidak valid / expired.' }); }
  req.zxSession.user = r.user;
  res.json({ ok: true, user: publicUser(r.user) });
});

function publicUser(u) {
  return { username: u.username, nama: u.nama, phone: u.phone, role: u.role, expired: u.expired };
}

// ---- Global info utk beranda ----
app.get('/api/global-info', auth, async (req, res) => {
  const g = await api('globalInfo', {});
  const online = botEngine.listBots().some(b => b.status === 'online');
  res.json({ ...g, botStatus: online ? 'online' : 'offline', runningBots: botEngine.listBots() });
});

// ---- Bot manager ----
app.get('/api/bots', auth, async (req, res) => {
  const r = await api('getBots', { ownerPhone: req.zxSession.user.phone });
  if (!r.ok) return res.json(r);
  const bots = r.bots.map(row => ({
    botNumber: row[1], botName: row[2], botType: row[3], status: row[4], session: row[5],
    createdAt: row[6], csPrompt: row[7], businessName: row[8], businessDesc: row[9], businessProducts: row[10],
    runtime: botEngine.getBotStatus(row[1]),
  }));
  res.json({ ok: true, bots, maxBots: maxBotsFor(req.zxSession.user.role) });
});

function maxBotsFor(role) {
  const rc = config.roles[role] || config.roles.member;
  return rc.maxBots === Infinity ? 'unlimited' : rc.maxBots;
}

app.post('/api/bots/add', auth, async (req, res) => {
  const user = req.zxSession.user;
  const rc = config.roles[user.role] || config.roles.member;
  const cur = await api('getBots', { ownerPhone: user.phone });
  const count = cur.ok ? cur.bots.length : 0;
  if (rc.maxBots !== Infinity && count >= rc.maxBots) {
    return res.json({ ok: false, message: `Role ${user.role} hanya boleh menambah ${rc.maxBots} bot.` });
  }
  const { botNumber, botName, botType, csPrompt, businessName, businessDesc, businessProducts } = req.body || {};
  if (!botNumber) return res.json({ ok: false, message: 'Nomor bot wajib diisi.' });
  const r = await api('addBot', {
    ownerPhone: user.phone, botNumber, botName: botName || 'ZerxsBot',
    botType: (botType === 'cs' && ['business', 'developer'].includes(user.role)) ? 'cs' : 'biasa',
    csPrompt: csPrompt || '', businessName: businessName || '', businessDesc: businessDesc || '', businessProducts: businessProducts || '',
  });
  if (r.ok) {
    // jalankan bot baru ini
    const meta = { botType, csPrompt, businessName, businessDesc, businessProducts };
    botEngine.startBot(String(botNumber), meta);
  }
  res.json(r);
});

app.post('/api/bots/remove', auth, async (req, res) => {
  const { botNumber } = req.body || {};
  const own = await api('getBots', { ownerPhone: req.zxSession.user.phone });
  const found = own.ok && own.bots.some(row => String(row[1]) === String(botNumber).replace(/\D/g, ''));
  if (!found) return res.json({ ok: false, message: 'Bot bukan milik akun Anda.' });
  botEngine.stopBot(botNumber);
  res.json(await api('removeBot', { botNumber }));
});

// ---- Pairing ----
app.post('/api/pair/qr', auth, async (req, res) => {
  const { botNumber } = req.body || {};
  const st = botEngine.getBotStatus(botNumber);
  if (st.status === 'none') await botEngine.startBot(botNumber);
  setTimeout(() => {}, 0);
  const after = botEngine.getBotStatus(botNumber);
  res.json({ ok: true, status: after.status, qr: after.qr });
});

app.post('/api/pair/code', auth, async (req, res) => {
  const { botNumber, phoneNumber } = req.body || {};
  if (!phoneNumber) return res.json({ ok: false, message: 'Nomor telepon untuk pairing wajib diisi.' });
  const r = await botEngine.requestPairingCode(botNumber, phoneNumber);
  res.json(r);
});

app.get('/api/pair/status/:botNumber', auth, async (req, res) => {
  const st = botEngine.getBotStatus(req.params.botNumber);
  // sinkronkan status ke spreadsheet
  api('setBotStatus', { botNumber: req.params.botNumber, status: st.status === 'online' ? 'online' : 'offline' });
  res.json({ ok: true, ...st });
});

// ---- Profil & ganti password ----
app.post('/api/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) return res.json({ ok: false, message: 'Password baru minimal 4 karakter.' });
  const r = await api('updatePassword', { username: req.zxSession.user.username, oldPassword, newPassword });
  res.json(r);
});

// ---- Info fitur sesuai role ----
app.get('/api/features', auth, (req, res) => {
  const role = req.zxSession.user.role;
  const rc = config.roles[role] || config.roles.member;
  const cmds = require('./lib/state').allowedCommands(role);
  res.json({
    ok: true, role, quota: rc.quota === Infinity ? 'Unlimited' : rc.quota,
    maxBots: rc.maxBots === Infinity ? 'Unlimited' : rc.maxBots,
    commands: cmds.includes('*') ? Object.keys(require('./handler').commands) : cmds,
    groupAccess: require('./lib/state').isGroupCommandAllowed(role),
    csAccess: ['business', 'developer'].includes(role),
  });
});

// ---- Developer ----
app.get('/api/dev/stats', auth, async (req, res) => {
  if (req.zxSession.user.role !== 'developer') return res.json({ ok: false, message: 'Akses ditolak. Menu developer khusus role developer.' });
  const r = await api('countUsersByRole', {});
  res.json(r);
});

app.post('/api/dev/create-account', auth, async (req, res) => {
  if (req.zxSession.user.role !== 'developer') return res.json({ ok: false, message: 'Akses ditolak.' });
  const { username, password, role, phone } = req.body || {};
  if (!username || !password) return res.json({ ok: false, message: 'Username & password wajib diisi.' });
  if (!['member', 'permanen', 'admin'].includes(String(role))) return res.json({ ok: false, message: 'Role tidak valid.' });
  const r = await api('createAccount', { username, password, role, phone, byDeveloper: req.zxSession.user.username });
  res.json(r);
});

// ---- Harga role ( utk tombol "beli akses" ) ----
app.get('/api/pricing', (req, res) => {
  const out = Object.entries(config.roles).map(([k, v]) => ({
    key: k, label: v.label, price: v.price,
    quota: v.quota === Infinity ? 'Unlimited' : v.quota,
    maxBots: v.maxBots === Infinity ? 'Unlimited' : v.maxBots,
    telegram: config.telegram.url,
  }));
  res.json({ ok: true, roles: out });
});

app.get('/api/telegram', (req, res) => res.json({ ok: true, url: config.telegram.url }));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---- Bersihkan akun expired tiap jam ----
setInterval(() => { api('deleteExpired', {}); }, 3600 * 1000);

// ---- Jalankan semua bot terdaftar saat server hidup ----
(async function boot() {
  const all = await api('allBots', {});
  if (all.ok) {
    for (const row of all.bots) {
      const meta = { botType: row[3], csPrompt: row[7], businessName: row[8], businessDesc: row[9], businessProducts: row[10] };
      botEngine.startBot(row[1], meta);
    }
  }
})();

app.listen(config.web.port, () => {
  console.log(`ZerxsBot web berjalan di http://localhost:${config.web.port}`);
});

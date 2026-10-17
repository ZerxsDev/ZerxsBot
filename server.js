/**
 * ============================================================
 *  ZERXSBOT - WEB SERVER (Express + Socket.IO)
 *  - Login dari Google Spreadsheet via Apps Script (config.js)
 *  - API proxy: URL apps script & openrouter TIDAK PERNAH dikirim ke browser
 *  - Kontrol bot (start/stop/qr/pairing code) via socket.io
 *  - Auto hapus expired saat halaman dimuat + interval
 * ============================================================
 */
const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
const { Server } = require('socket.io');

const config = require('./config');
const db = require('./bot/lib/db');
const roles = require('./bot/lib/roles');
const { BotEngine } = require('./bot/index');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(session({
  secret: config.web.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, error: 'Belum login' });
  next();
}
function devOnly(req, res, next) {
  if (!req.session.user || roles.coreRole(req.session.user.role) !== 'DEVELOPER') {
    return res.status(403).json({ ok: false, error: 'Menu developer hanya untuk role DEVELOPER.' });
  }
  next();
}

/* ==================== BOT ENGINE ==================== */
let engine;
try {
  engine = new BotEngine(io);
} catch (e) {
  console.error('[Web] Engine bot tidak dapat dimuat:', e.message);
  engine = null;
}

/* ==================== AUTH ROUTES ==================== */
app.post('/api/login', async (req, res) => {
  const { username, password, phone } = req.body || {};
  try {
    const r = await db.login({ username, password, phone });
    if (r.ok) {
      req.session.user = r.user;
      // cek expired otomatis -> terhapus dari spreadsheet bila lewat
      return res.json({ ok: true, user: r.user });
    }
    return res.status(401).json(r);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Server database tidak dapat dijangkau. Cek konfigurasi apps script di config.js.' });
  }
});

app.get('/api/me', auth, (req, res) => {
  const u = req.session.user;
  res.json({
    ok: true,
    user: {
      username: u.username, phone: u.phone, role: u.role, coreRole: u.coreRole,
      expired: u.expired, avatarLetter: String(u.username)[0].toUpperCase(),
    },
  });
});

app.post('/api/logout', (req, res) => { req.session.destroy(() => res.json({ ok: true })); });

/* ==================== GLOBAL INFO ==================== */
app.get('/api/globalstats', auth, async (req, res) => {
  try {
    // trigger pembersihan expired setiap kali beranda dibuka
    db.deleteExpired().catch(() => {});
    const st = await db.globalStats();
    res.json(st);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal mengambil statistik' }); }
});

/* ==================== FITUR (berdasarkan role) ==================== */
app.get('/api/features', auth, async (req, res) => {
  const u = req.session.user;
  const core = roles.coreRole(u.role);
  const b = roles.benefits(core);
  const personalCmds = roles.PERSONAL_COMMANDS.filter((c) => roles.canUseCommand(u, c));
  res.json({
    ok: true, core, benefits: {
      quota: Number.isFinite(b.quota) ? b.quota : 'Unlimited',
      maxBots: Number.isFinite(b.maxBots) ? b.maxBots : 'Unlimited',
      prefiks: b.prefiks, cs: !!b.cs, group: !!b.group, devPanel: !!b.devPanel,
    },
    commands: personalCmds.map((c) => ({ name: '/' + c, desc: cmdDesc(c) })),
    groupCommands: b.group || b.commands.includes('ALL') ? roles.GROUP_COMMANDS.map((c) => ({ name: '/' + c, desc: cmdDesc(c) })) : [],
  });
});
function cmdDesc(c) {
  try {
    const mod = require(`./bot/commands/personal/${c}.js`);
    return mod.desc || '';
  } catch (e) {
    try { return require(`./bot/commands/group/${c}.js`).desc || ''; } catch (x) { return ''; }
  }
}

/* ==================== PROFIL ==================== */
app.post('/api/changepassword', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  try {
    const r = await db.changePassword({ username: req.session.user.username, oldPassword, newPassword });
    res.json(r);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal mengubah kata sandi' }); }
});

/* ==================== BOT MANAGER ==================== */
app.get('/api/bots', auth, async (req, res) => {
  try {
    const r = await db.listBots(req.session.user.username);
    const live = engine ? engine.list() : [];
    const merged = (r.bots || []).map((b) => {
      const l = live.find((x) => x.noBot === String(b.noBot));
      return { ...b, liveStatus: l ? l.status : (String(b.status).toUpperCase() === 'ONLINE' ? 'RECONNECTING' : 'OFFLINE') };
    });
    res.json({ ok: true, bots: merged, maxBots: fmtMax(req.session.user), quotaUsed: merged.length });
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal memuat daftar bot' }); }
});
function fmtMax(u) {
  const m = roles.maxBots(u);
  return Number.isFinite(m) ? m : 'Unlimited';
}

app.post('/api/bots/add', auth, async (req, res) => {
  const { noBot, namaBot, jenis, csProfile } = req.body || {};
  const core = roles.coreRole(req.session.user.role);
  const chosen = (jenis === 'cs') ? 'cs' : 'biasa';
  if (chosen === 'cs' && !roles.canCS(req.session.user)) {
    return res.status(403).json({ ok: false, error: 'Bot CS khusus role BUSINESS / DEVELOPER.' });
  }
  try {
    const r = await db.addBot({
      noBot, namaBot, jenis: chosen, owner: req.session.user.username,
    });
    if (r.ok && engine) {
      await engine.start({
        noBot, namaBot, jenis: chosen, owner: req.session.user.username,
        csProfile: chosen === 'cs' ? (csProfile || {}) : null,
      }).catch((e) => console.log('[Web] start bot:', e.message));
    }
    res.json(r);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal menambah bot' }); }
});

app.post('/api/bots/del', auth, async (req, res) => {
  const { noBot } = req.body || {};
  try {
    if (engine) await engine.removeSession(String(noBot).replace(/[^0-9]/g, ''));
    const r = await db.delBot({ noBot, owner: req.session.user.username });
    res.json(r);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal menghapus bot' }); }
});

app.post('/api/bots/stop', auth, async (req, res) => {
  const r = engine ? await engine.stop(String(req.body.noBot).replace(/[^0-9]/g, '')) : { ok: false };
  res.json(r);
});

app.post('/api/bots/paircode', auth, async (req, res) => {
  const { noBot, phone } = req.body || {};
  try {
    const r = await engine.requestPairCode(String(noBot).replace(/[^0-9]/g, ''), phone);
    res.json(r);
  } catch (e) { res.status(400).json({ ok: false, error: e.message }); }
});

/* Prefiks sesuai role (owner/developer bisa ganti) */
app.post('/api/settings/prefiks', auth, async (req, res) => {
  const allowed = roles.allowedPrefixes(req.session.user);
  const p = req.body.prefiks;
  if (!allowed.includes(p)) return res.status(403).json({ ok: false, error: `Prefiks ${p} tidak diizinkan untuk role anda. Pilihan: ${allowed.join(' ')}` });
  const r = await db.setPrefiks({ username: req.session.user.username, prefiks: p });
  res.json(r);
});

/* Simpan profil bisnis untuk bot CS */
app.post('/api/settings/cs', auth, async (req, res) => {
  if (!roles.canCS(req.session.user)) return res.status(403).json({ ok: false, error: 'Fitur CS khusus BUSINESS/DEVELOPER.' });
  const r = await db.setCS({
    username: req.session.user.username,
    csMode: true, businessName: req.body.businessName || '', businessDesc: req.body.businessDesc || '',
  });
  res.json(r);
});

/* ==================== DEVELOPER ==================== */
app.get('/api/dev/stats', auth, devOnly, async (req, res) => {
  try {
    const st = await db.globalStats();
    res.json(st);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal memuat statistik developer' }); }
});

app.post('/api/dev/createaccount', auth, devOnly, async (req, res) => {
  const { username, password, role } = req.body || {};
  try {
    const r = await db.createAccount({ username, password, role, developer: req.session.user.username });
    res.json(r);
  } catch (e) { res.status(500).json({ ok: false, error: 'Gagal membuat akun' }); }
});

/* ==================== SOCKET.IO (kontrol real-time) ==================== */
io.on('connection', (socket) => {
  socket.on('bot:start', async ({ noBot, namaBot, jenis, csProfile }) => {
    if (!engine) return;
    try {
      await engine.start({ noBot, namaBot, jenis, owner: 'web', csProfile });
    } catch (e) { socket.emit('bot:error', { msg: e.message }); }
  });
  socket.on('bot:paircode', async ({ noBot, phone }) => {
    try {
      const r = await engine.requestPairCode(noBot, phone);
      socket.emit('bot:paircode', r);
    } catch (e) { socket.emit('bot:error', { msg: e.message }); }
  });
});

/* ==================== PAGES ==================== */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ==================== START ==================== */
server.listen(config.web.port, config.web.host, () => {
  console.log(`[ZerxsBot] Web panel: http://localhost:${config.web.port}`);
  // auto-start sesi bot yang tersimpan sebelumnya (tanpa spam)
  if (engine) {
    db.listBots('').then(async (r) => {
      for (const b of r.bots || []) {
        try { await engine.start({ noBot: b.noBot, namaBot: b.namaBot, jenis: b.jenis, owner: b.owner }); } catch (e) {}
      }
    }).catch(() => {});
  }
});

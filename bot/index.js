/**
 * ============================================================
 *  ZERXSBOT - MESIN BOT WHATSAPP (Baileys / @whiskeysockets)
 *  - Multi akun bot (dikelola dari web Bot Manager via socket.io)
 *  - Pairing: qrcode + pairing code (nomor telepon)
 *  - Prefiks sesuai role user (default '/'), salah perintah -> peringatan
 *  - Kuota harian per role, reset jam 00.00
 *  - Auto-hapus akun expired dari spreadsheet (interval config)
 *  - Log ringkas, tanpa spam
 * ============================================================
 */
const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');
const pino = require('pino');
const qrcode = require('qrcode');

let baileys;
try {
  baileys = require('@whiskeysockets/baileys');
} catch (e) {
  console.error('[ZerxsBot] Paket @whiskeysockets/baileys belum terinstal. Jalankan: npm install');
  throw e;
}
const makeWASocket = baileys.default || baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore, getAggregateVotesInPollMessage } = baileys;

const config = require('../config');
const db = require('./lib/db');
const roles = require('./lib/roles');
const ai = require('./lib/ai');
const media = require('./lib/media');
const { bindSend } = require('./lib/helpers');
const { loadCommands } = require('./loader');

const log = pino({ level: 'silent' }); // diamkan log internal bailey agar tidak spam
const logger = { info: () => {}, warn: () => {}, error: () => {}, fatal: () => {}, trace: () => {}, child: () => logger, level: 'silent', silent: true };

class BotEngine extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.sessions = new Map();   // noBot -> { sock, state, status, jenis, owner, meta }
    this.commands = loadCommands();
    this.groupSettings = new Map(); // jid -> { antilink, antitoxic, welcome, filters: [] }
    fs.ensureDirSync(config.bot.sessionDir);
    fs.ensureDirSync(config.bot.tmpDir);
    this._startExpireJob();
  }

  /* ==================== LOG RINGKAS ==================== */
  say(msg) {
    // satu baris informatif saja, tanpa pengulangan kata berlebihan
    console.log(`[ZerxsBot] ${msg}`);
    if (this.io) this.io.emit('bot:log', { msg, time: Date.now() });
  }

  emitStatus(noBot, extra = {}) {
    const s = this.sessions.get(noBot);
    const payload = {
      noBot,
      status: s?.status || 'OFFLINE',
      jenis: s?.jenis || 'biasa',
      owner: s?.owner || '-',
      name: s?.meta?.name || '',
      ...extra,
    };
    if (this.io) this.io.emit('bot:status', payload);
    db.setBotStatus({ noBot, status: payload.status }).catch(() => {});
  }

  /* ==================== START / STOP BOT ==================== */
  async start({ noBot, namaBot = '', jenis = 'biasa', owner = '', csProfile = null }) {
    noBot = String(noBot).replace(/[^0-9]/g, '');
    if (!noBot) throw new Error('Nomor bot tidak valid');
    if (this.sessions.has(noBot)) return { ok: true, message: 'Bot sudah berjalan' };

    const sessionPath = path.join(config.bot.sessionDir, noBot);
    fs.ensureDirSync(sessionPath);
    const { state, credsUpdatedWith } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 16] }));

    const sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      logger,
      printQRInTerminal: false,
      browser: ['ZerxsBot', 'chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    const entry = { sock, state, status: 'connecting', jenis, owner, namaBot, csProfile, qrTimer: null };
    this.sessions.set(noBot, entry);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastPullFail, receivedPendingNotifications } = update;
      if (update.qr) {
        entry.status = 'qr';
        try {
          const qrDataUrl = await qrcode.toDataURL(update.qr, { margin: 1, width: 320 });
          this.say(`QR dibuat untuk ${noBot} — scan di web Panel Bot`);
          if (this.io) this.io.emit('bot:qr', { noBot, qr: update.qr, qrDataUrl });
        } catch (e) {}
      }
      if (connection === 'open') {
        entry.status = 'online';
        this.say(`${noBot} online${namaBot ? ` (${namaBot})` : ''}`);
        this.emitStatus(noBot);
        this.io?.emit('bot:paired', { noBot });
      } else if (connection === 'close') {
        const reason = lastPullFail?.error?.output?.statusCode || DisconnectReason.loggedOut;
        if (reason === DisconnectReason.loggedOut) {
          await fs.remove(sessionPath).catch(() => {});
          this.sessions.delete(noBot);
          this.say(`${noBot} keluar (logged out), sesi dihapus`);
          this.emitStatus(noBot, { status: 'OFFLINE' });
        } else {
          this.sessions.delete(noBot);
          entry.status = 'offline';
          this.emitStatus(noBot, { status: 'OFFLINE' });
          setTimeout(() => this.start({ noBot, namaBot, jenis, owner, csProfile }).catch(() => {}), 5000);
        }
      }
    });

    sock.ev.on('creds.update', () => {});

    /* ---------- pesan masuk ---------- */
    sock.ev.on('messages.upsert', (m) => this._onMessage(entry, noBot, m).catch((err) => {
      this.say(`Error proses pesan ${noBot}: ${err.message}`);
    }));

    // restore riwayat singkat tanpa spam
    return { ok: true, noBot };
  }

  /** Minta pairing code untuk nomor target (user memasukkan nomor HP) */
  async requestPairCode(noBot, phone) {
    const entry = this.sessions.get(noBot);
    if (!entry) throw new Error('Bot belum dijalankan. Start bot terlebih dahulu.');
    phone = String(phone).replace(/[^0-9]/g, '').replace(/^0+/, '62');
    if (!/^62\d{8,13}$/.test(phone)) throw new Error('Format nomor tidak valid. Gunakan +62xxxxxxxxxx');
    try {
      const { code } = await entry.sock.requestPairingCode(phone.toUpperCase(), 'ZRXS');
      this.say(`Pairing code untuk ${phone}: ${code}`);
      return { ok: true, code, phone };
    } catch (e) {
      throw new Error('Gagal meminta pairing code: ' + (e.message || e));
    }
  }

  async stop(noBot) {
    const entry = this.sessions.get(noBot);
    if (!entry) return { ok: false, error: 'Bot tidak ditemukan' };
    try { entry.sock.logout?.(); } catch (e) {}
    try { entry.sock.end?.(); } catch (e) {}
    this.sessions.delete(noBot);
    this.emitStatus(noBot, { status: 'OFFLINE' });
    this.say(`${noBot} dihentikan`);
    return { ok: true };
  }

  async removeSession(noBot) {
    await this.stop(noBot);
    await fs.remove(path.join(config.bot.sessionDir, noBot)).catch(() => {});
  }

  list() {
    return [...this.sessions.entries()].map(([no, e]) => ({
      noBot: no, status: e.status.toUpperCase(), jenis: e.jenis, owner: e.owner, namaBot: e.namaBot,
    }));
  }

  /* ==================== ROUTER PESAN ==================== */
  async _onMessage(entry, noBot, m) {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) {
      const chatJid = msg.key.remoteJid;
      if (!chatJid || chatJid === 'status@broadcast') continue;
      const isGroup = chatJid.endsWith('@g.us');

      // simpan pesan view-once (untuk /nosecret)
      const ctx = this._buildContext(entry, noBot, msg, chatJid, isGroup);
      if (!ctx.text && !ctx.message) continue;

      /* ----- BOT CS: tanpa prefiks, balas seperti customer service ----- */
      if (entry.jenis === 'cs' && !isGroup) {
        await this._handleCS(entry, ctx);
        return;
      }

      /* ----- Grup: antilink / antitoxic / welcome ----- */
      if (isGroup) {
        const gs = this._groupCfg(chatJid);
        const sender = ctx.sender;
        // filter grup: kirim ulang pesan yang difilter? (showfilter manual)
        if (gs.antilink && ctx.text && /(https?:\/\/|wa\.me|t\.me|bit\.ly)/i.test(ctx.text)) {
          await this._deleteMsg(ctx);
          await this._mute(ctx.chatJid, sender, 24 * 3600);
          await this._send(ctx.chatJid, '🚫 Link terdeteksi! Pesan dihapus & pengguna dimute 1 hari. (antilink)', { quoted: msg });
          continue;
        }
        if (gs.antitoxic && ctx.text && config.toxicWords.some((w) => ctx.text.toLowerCase().includes(w))) {
          await this._deleteMsg(ctx);
          await this._mute(ctx.chatJid, sender, 24 * 3600);
          await this._send(ctx.chatJid, '🚫 Kata kasar terdeteksi! Pesan dihapus & pengguna dimute 1 hari. (antitoxic)', { quoted: msg });
          continue;
        }
      }

      /* ----- Parse prefiks ----- */
      const text = (ctx.text || '').trim();
      let body = null, prefixUsed = null;
      // default prefiks '/', tapi cek prefiks khusus user (owner/developer bisa ganti)
      const userByPhone = await this._findUserBySender(ctx.sender);
      const allowedPrefixes = userByPhone ? roles.allowedPrefixes(userByPhone) : config.roleBenefits.member.prefiks;
      for (const p of allowedPrefixes) {
        if (text.startsWith(p)) { body = text.slice(p.length).trim(); prefixUsed = p; break; }
      }
      // also accept any single-char prefix from the global set so bot "merespon jika ada prefiks /"
      if (!prefixUsed && /^[\/\.\!\#\?\>]/.test(text)) {
        prefixUsed = text[0]; body = text.slice(1).trim();
      }

      if (!prefixUsed) {
        // bukan perintah & bukan CS -> abaikan (hemat kuota)
        return;
      }

      const [cmdName, ...argsArr] = body.split(/\s+/);
      const cmd = (cmdName || '').toLowerCase();
      const command = this.commands[cmd];

      if (!command) {
        await this._send(ctx.chatJid,
          `⚠️ Perintah *${prefixUsed}${cmd || ''}* tidak dikenal / salah perintah.\nSilakan gunakan ${prefixUsed}menu untuk melihat daftar perintah yang benar.`,
          { quoted: msg });
        return;
      }

      /* ----- Autentikasi user dari spreadsheet ----- */
      if (!userByPhone) {
        await this._send(ctx.chatJid,
          `❌ Nomor kamu belum terdaftar sebagai pengguna ZerxsBot.\nAkun dibuat secara manual oleh admin di database. Hubungi ${config.social.telegram} untuk membeli akses.`,
          { quoted: msg });
        return;
      }

      /* ----- Cek expired ----- */
      if (this._isExpired(userByPhone.expired)) {
        await db.getUser(userByPhone.username); // trigger auto delete di apps script
        await this._send(ctx.chatJid, '⛔ Akun kamu sudah EXPIRED dan otomatis dihapus dari database. Beli ulang akses: ' + config.social.telegram, { quoted: msg });
        return;
      }

      /* ----- Hak akses command per role ----- */
      const core = roles.coreRole(userByPhone.role);
      if (isGroup && roles.GROUP_COMMANDS.includes(cmd) && core !== 'DEVELOPER') {
        await this._send(ctx.chatJid, '⛔ Perintah grup hanya dapat digunakan oleh role DEVELOPER.', { quoted: msg });
        return;
      }
      if (!roles.canUseCommand(userByPhone, cmd)) {
        await this._send(ctx.chatJid, `⛔ Command *${prefixUsed}${cmd}* tidak tersedia untuk role *${userByPhone.role}*.\nUpgrade akses: ${config.social.telegram}`, { quoted: msg });
        return;
      }

      /* ----- Kuota harian (kecuali menu/info/tutor & unlimited) ----- */
      const freeCmds = ['menu', 'info', 'tutor'];
      const quota = roles.dailyQuota(userByPhone);
      if (!freeCmds.includes(cmd) && Number.isFinite(quota)) {
        const st = await db.useCommand(userByPhone.username).catch(() => null);
        const used = st?.used ?? 0;
        if (used > quota) {
          await this._send(ctx.chatJid, `🈳 LIMIT HABIS\nKuota harian role ${core} = ${quota}x chat/hari sudah terpakai semua.\nLimit akan direset besok jam 00.00.`, { quoted: msg });
          return;
        }
        ctx.quotaInfo = { used, quota };
      }

      /* ----- Eksekusi command ----- */
      ctx.args = argsArr;
      ctx.body = body;
      ctx.prefix = prefixUsed;
      ctx.user = userByPhone;
      ctx.botNo = noBot;
      ctx.botEntry = entry;
      ctx.engine = this;
      ctx.config = config;
      ctx.ai = ai;
      ctx.media = media;
      ctx.db = db;
      ctx.roles = roles;
      bindSend(ctx);
      try {
        await command.handler(ctx);
      } catch (err) {
        await this._send(ctx.chatJid, '❌ Terjadi kesalahan: ' + err.message, { quoted: msg });
      }
    }
  }

  /* ==================== CS MODE ==================== */
  async _handleCS(entry, ctx) {
    const prof = entry.csProfile || {};
    const bizName = prof.businessName || entry.namaBot || 'Toko Kami';
    const bizDesc = prof.businessDesc || prof.systemPrompt || 'Kami melayani penjualan dan penyewaan jasa dengan harga terjangkau.';
    const hour = new Date().getHours();
    const greetingTime = hour < 11 ? 'Pagi' : hour < 15 ? 'Siang' : hour < 18 ? 'Sore' : 'Malam';
    const text = (ctx.text || '').trim();
    if (!text) return;

    const sys = `Kamu adalah customer service resmi "${bizName}".
Profil bisnis: ${bizDesc}
Aturan balasan:
- Bahasa Indonesia baku, sopan, ramah, mudah dipahami, seolah CS manusia asli.
- Sapa dengan "Selamat ${greetingTime} Kak, ada yang bisa kami bantu?" bila pelanggan membuka chat (halo/p/kak/bang/dll).
- Jika pelanggan ingin membeli/menyewa, tawarkan harga secara sopan beserta benefit.
- Jelaskan produk/jasa yang dijual dan harganya berdasarkan profil bisnis.
- Jika pertanyaan di luar bisnis, jawab: "Maaf saya tidak bisa membantu karena saya adalah CS khusus menjawab pertanyaan anda seputar bisnis kami."
- Keluhan pelanggan ditangani dengan empati.`;

    const reply = await ai.chat(
      [{ role: 'system', content: sys }, { role: 'user', content: text }],
      { model: config.openrouter.csModel, temperature: 0.6 }
    ).catch(() => `Selamat ${greetingTime} Kak 🙏 Terima kasih telah menghubungi ${bizName}. Ada yang bisa kami bantu?`);

    await this._send(ctx.chatJid, reply, { quoted: ctx.raw });
  }

  /* ==================== HELPERS ==================== */
  _buildContext(entry, noBot, msg, chatJid, isGroup) {
    const m = msg.message || {};
    const text =
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      '';
    const sender = isGroup ? (msg.key.participant || m.sender || '') : chatJid;
    return {
      raw: msg, msg, chatJid, isGroup, sender, text,
      message: m,
      quoted: m.extendedTextMessage?.contextInfo?.quotedMessage || null,
      participant: msg.key.participant,
      author: msg.key.fromMe ? sender : (msg.pushName || ''),
    };
  }

  _groupCfg(jid) {
    if (!this.groupSettings.has(jid)) {
      this.groupSettings.set(jid, { antilink: false, antitoxic: false, welcome: false, filters: [] });
    }
    return this.groupSettings.get(jid);
  }

  async _send(jid, content, opt = {}) {
    // cari sock dari konteks pemanggil via engine sessions (jid milik sock mana?)
    // disederhanakan: fungsi ini dipanggil dengan binding sock melalui ctx.send
    for (const [, e] of this.sessions) {
      try { await e.sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, opt); return; } catch (err) {}
    }
  }

  async _deleteMsg(ctx) {
    for (const [, e] of this.sessions) {
      try {
        await e.sock.sendMessage(ctx.chatJid, { delete: ctx.raw.key });
        return;
      } catch (err) {}
    }
  }

  async _mute(jid, participant, seconds) {
    for (const [, e] of this.sessions) {
      try {
        await e.sock.groupSettingUpdate(jid, 'announcement');
        setTimeout(async () => { try { await e.sock.groupSettingUpdate(jid, 'not_announcement'); } catch (x) {} }, seconds * 1000);
        return;
      } catch (err) {}
    }
  }

  _isExpired(expiredStr) {
    if (!expiredStr) return false;
    const s = String(expiredStr).toUpperCase();
    if (s === 'PERMANEN' || s === 'PERMANENT' || s === '-') return false;
    const d = new Date(expiredStr);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  /** Cocokkan pengirim WA dengan data users spreadsheet (nomor harus sama) */
  async _findUserBySender(senderJid) {
    if (!senderJid) return null;
    const num = senderJid.split('@')[0].replace(/[^0-9]/g, '');
    if (!this._userCache) this._userCache = { ts: 0, list: [] };
    if (Date.now() - this._userCache.ts > 60000) {
      try {
        const r = await db.listUsers();
        this._userCache = { ts: Date.now(), list: r.users || [] };
      } catch (e) { return null; }
    }
    return this._userCache.list.find((u) => String(u.phone).replace(/[^0-9]/g, '').endsWith(num) ||
      num.endsWith(String(u.phone).replace(/[^0-9]/g, ''))) || null;
  }

  /* ==================== AUTO DELETE EXPIRED ==================== */
  _startExpireJob() {
    setInterval(async () => {
      try {
        const r = await db.deleteExpired();
        if (r?.removed?.length) this.say(`${r.removed.length} akun expired dihapus dari spreadsheet`);
      } catch (e) {}
    }, config.bot.expireCheckIntervalMs);
  }
}

module.exports = { BotEngine };

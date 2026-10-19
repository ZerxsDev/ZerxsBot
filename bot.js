// ZerxsBot Bot Engine - Baileys multi-session, pairing QR & code via web
const makeWASocket = require('@whiskeysockets/bailey').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/bailey');
const qrcode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const handler = require('./handler');

const sessionsDir = path.resolve(config.sessionFolder);
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

// Map botNumber -> { sock, auth, qr, pairingCode, status, meta }
const bots = new Map();

function log(...a) { /* tidak spam kata-kata promo; hanya info ringkas */ console.log('[bot]', ...a); }

async function startBot(botNumber, meta = {}) {
  botNumber = String(botNumber).replace(/[^0-9]/g, '');
  if (bots.has(botNumber) && bots.get(botNumber).status === 'online') {
    return { ok: true, message: 'Bot sudah berjalan' };
  }
  const sessionPath = path.join(sessionsDir, 'zx_' + botNumber);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const entry = { status: 'connecting', qr: null, pairingCode: null, sock: null, meta };
  bots.set(botNumber, entry);

  try {
    const { state, credsSaveState } = await useMultiFileAuthState(sessionPath);
    let version;
    try { version = (await fetchLatestBaileysVersion()).version; } catch (e) { version = undefined; }
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['ZerxsBot', 'Chrome', '1.0.0'],
      version,
    });
    entry.sock = sock;

    sock.ev.on('connection.update', async (u) => {
      const { connection, qr, pairingCode, lastRecvQuestion } = u;
      if (qr) {
        entry.status = 'qr';
        try { entry.qr = await qrcode.toDataURL(qr); } catch (e) { entry.qr = qr; }
        log(`bot ${botNumber}: QR siap`);
      }
      if (pairingCode) {
        entry.status = 'pairing';
        entry.pairingCode = pairingCode;
        log(`bot ${botNumber}: Pairing code ${pairingCode}`);
      }
      if (connection === 'open') {
        entry.status = 'online';
        entry.qr = null; entry.pairingCode = null;
        log(`bot ${botNumber}: online`);
        handler.register(sock, botNumber, entry);
      } else if (connection === 'close') {
        entry.status = 'offline';
        const reason = u.lastProtoError?.message || '';
        if (/logged-out|device-list-grid/i.test(reason)) {
          log(`bot ${botNumber}: logged out, sesi dibersihkan`);
          stopBot(botNumber);
        } else {
          log(`bot ${botNumber}: reconnect...`);
          setTimeout(() => startBot(botNumber, meta), 4000);
        }
      }
    });

    // simpan creds
    sock.ev.on('creds.update', credsSaveState);
    return { ok: true };
  } catch (e) {
    entry.status = 'error';
    log(`bot ${botNumber}: error ${e.message}`);
    return { ok: false, message: e.message };
  }
}

// Minta pairing code dengan nomor telepon user (bukan nomor bot)
async function requestPairingCode(botNumber, phoneNumber) {
  botNumber = String(botNumber).replace(/[^0-9]/g, '');
  phoneNumber = String(phoneNumber).replace(/[^0-9]/g, '');
  let entry = bots.get(botNumber);
  if (!entry) {
    const r = await startBot(botNumber);
    if (!r.ok) return r;
    entry = bots.get(botNumber);
  }
  if (entry.status === 'online') return { ok: false, message: 'Bot sudah terhubung.' };
  if (!entry.sock) return { ok: false, message: 'Sock belum siap, coba lagi sebentar.' };
  try {
    // minta kode baru setiap kali diminta agar fresh
    const code = await entry.sock.requestPairingCode(phoneNumber.toUpperCase().startsWith('62') ? phoneNumber : phoneNumber);
    entry.pairingCode = code;
    entry.status = 'pairing';
    return { ok: true, code };
  } catch (e) {
    return { ok: false, message: 'Gagal meminta pairing code: ' + e.message };
  }
}

function getBotStatus(botNumber) {
  const e = bots.get(String(botNumber).replace(/[^0-9]/g, ''));
  if (!e) return { status: 'none' };
  return { status: e.status, qr: e.qr, pairingCode: e.pairingCode };
}

function listBots() {
  const out = [];
  for (const [num, e] of bots.entries()) {
    out.push({ number: num, status: e.status, hasQr: !!e.qr, pairingCode: e.pairingCode });
  }
  return out;
}

function stopBot(botNumber) {
  const e = bots.get(String(botNumber).replace(/[^0-9]/g, ''));
  if (e) {
    try { e.sock && e.sock.logout && e.sock.logout(); } catch (_) {}
    try { e.sock && e.sock.end && e.sock.end(); } catch (_) {}
    bots.delete(String(botNumber).replace(/[^0-9]/g, ''));
  }
}

module.exports = { startBot, stopBot, requestPairingCode, getBotStatus, listBots, bots };

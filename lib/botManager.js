/**
 * ZerxsBot - Manager koneksi Baileys multi-bot.
 * Setiap user dapat menambhkan nomor bot lewat Bot Manager di web;
 * pairing (QR / pairing code) dilakukan dari website, bukan terminal.
 * Log dibuat senyap (tidak spam).
 */
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBootstrapConfig,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const db = require("./db");

const logger = pino({ level: "silent" });

/** Map in-memory: sessionId -> state bot */
const bots = new Map();

/** Daftar pendengar event untuk SSE di web. */
const listeners = new Set();

function emit(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (_) {}
  });
}

function sessionPath(sessionId) {
  return path.join(config.pairing.folderSessions, String(sessionId));
}

function sanitizeNumber(n) {
  let s = String(n || "").replace(/[^0-9]/g, "");
  if (s.startsWith("0")) s = "62" + s.slice(1);
  if (s.startsWith("8") && s.length < 12) s = "62" + s;
  return s;
}

/** Ambil daftar bot yang dikelola manager. */
function listLocal() {
  return Array.from(bots.values()).map((b) => ({
    sessionId: b.sessionId,
    botNumber: b.botNumber,
    botName: b.botName,
    type: b.type,
    owner: b.owner,
    status: b.status,
    pairedAt: b.pairedAt,
  }));
}

/**
 * Start proses pairing bot baru.
 * @param {object} opts { sessionId, botNumber, botName, type, owner }
 * @returns {object} status awal
 */
async function startPairing(opts) {
  const sessionId = String(opts.sessionId);
  if (bots.has(sessionId) && ["pairing", "qr", "online"].includes(bots.get(sessionId).status)) {
    return bots.get(sessionId);
  }
  const dir = sessionPath(sessionId);
  fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false, // QR hanya tampil di WEB
    browser: ["ZerxsBot Web", "Chrome", "1.0.0"],
    version: [2, 3000, 1015_90],
    syncFullHistory: false,
  });

  const bot = {
    sessionId,
    sock,
    saveCreds,
    botNumber: opts.botNumber || "",
    botName: opts.botName || config.botName,
    type: opts.type || "biasa",
    owner: opts.owner || "",
    status: "connecting",
    qr: null,
    qrTs: 0,
    pairingCode: null,
    pairedAt: null,
    qrTimer: null,
  };
  bots.set(sessionId, bot);
  publish(bot);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastPullFail, qr, receivedPendingNotifications } = u;
    if (u.qr) {
      bot.status = "qr";
      bot.qr = u.qr;
      bot.qrTs = Date.now();
      try {
        bot.qrDataUrl = await qrcode.toDataURL(u.qr, {
          width: 420,
          margin: 2,
        });
      } catch (_) {
        bot.qrDataUrl = null;
      }
      publish(bot);
      if (!bot.qrTimer) {
        bot.qrTimer = setInterval(() => {
          if (Date.now() - bot.qrTs > config.pairing.qrTtlMs) {
            clearInterval(bot.qrTimer);
            bot.qrTimer = null;
            try {
              sock.requestPairingCode?.(bot.phoneForPair || null);
            } catch (_) {}
          }
        }, config.pairing.qrTtlMs);
      }
    }
    if (connection === "close") {
      const loggedOut =
        lastPullFail && /logged|logout|device_removed/i.test(String(lastPullFail));
      bot.status = loggedOut ? "loggedout" : "offline";
      cleanupTimers(bot);
      publish(bot);
      syncBotStatusToSheet(bot);
      if (!loggedOut) {
        // reconnect otomatis tanpa spam log
        setTimeout(() => {
          if (bots.get(sessionId) === bot && bot.status !== "online") {
            try {
              sock.end(new Error("reconnect"));
            } catch (_) {}
            bots.delete(sessionId);
            startPairing({
              sessionId,
              botNumber: bot.botNumber,
              botName: bot.botName,
              type: bot.type,
              owner: bot.owner,
            }).catch(() => {});
          }
        }, 4000);
      } else {
        removeSession(sessionId);
      }
      void receivedPendingNotifications;
    }
    if (connection === "open") {
      bot.status = "online";
      bot.qr = null;
      bot.qrDataUrl = null;
      bot.pairedAt = new Date().toISOString();
      const jid = sock.user && sock.user.id;
      if (jid) bot.botNumber = sanitizeNumber(jid.split(":")[0]);
      cleanupTimers(bot);
      publish(bot);
      syncBotStatusToSheet(bot);
      registerHandlers(sock, bot);
    }
  });

  sock.ev.on("creds.update", saveCreds);
  publish(bot);
  return bot;
}

/** Minta PAIRING CODE via NOMOR TELEPON (perbaikan pairing code). */
async function requestPairingCode(sessionId, phone) {
  const bot = bots.get(sessionId);
  if (!bot) throw new Error("Sesi pairing tidak ditemukan. Mulai ulang pairing.");
  const clean = sanitizeNumber(phone);
  if (!/^62\d{8,13}$/.test(clean) && !/^\d{10,15}$/.test(clean)) {
    throw new Error("Nomor telepon tidak valid. Contoh: 0812xxxxxxx atau 62812xxxxxxx");
  }
  bot.phoneForPair = clean;
  try {
    const code = await bot.sock.requestPairingCode(clean);
    if (!code) throw new Error("Kode pairing kosong dari WhatsApp");
    bot.pairingCode = code;
    bot.status = "pairing";
    publish(bot);
    return code;
  } catch (err) {
    // fallback: beberapa versi butuh restart socket
    throw new Error("Gagal mengambil kode pairing: " + err.message);
  }
}

/** Ambil data QR aktif (dataURL) untuk ditampilkan di web. */
function getQr(sessionId) {
  const bot = bots.get(sessionId);
  if (!bot) return null;
  return {
    status: bot.status,
    qrDataUrl: bot.qrDataUrl,
    pairingCode: bot.pairingCode,
  };
}

/** Hentikan dan hapus bot. */
function stopBot(sessionId, { logout = true } = {}) {
  const bot = bots.get(sessionId);
  if (!bot) return false;
  cleanupTimers(bot);
  try {
    if (logout && bot.sock) bot.sock.logout();
  } catch (_) {}
  bots.delete(sessionId);
  if (logout) removeSession(sessionId);
  emit({ type: "removed", sessionId });
  return true;
}

function removeSession(sessionId) {
  try {
    fs.rmSync(sessionPath(sessionId), { recursive: true, force: true });
  } catch (_) {}
}

function cleanupTimers(bot) {
  if (bot.qrTimer) {
    clearInterval(bot.qrTimer);
    bot.qrTimer = null;
  }
}

function publish(bot) {
  emit({
    type: "update",
    sessionId: bot.sessionId,
    status: bot.status,
    qrDataUrl: bot.qrDataUrl || null,
    pairingCode: bot.pairingCode || null,
    botNumber: bot.botNumber,
    botName: bot.botName,
    type_: bot.type,
  });
}

async function syncBotStatusToSheet(bot) {
  if (!bot.botNumber) return;
  try {
    await db.updateBot(bot.botNumber, { status: bot.status });
  } catch (_) {
    /* spreadsheet offline: abaikan agar bot tetap jalan */
  }
}

/* ---------------- Handler pesan (dipakai command handler) -------- */
function registerHandlers(sock, bot) {
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const handler = require("./handler");
      await handler(sock, bot, m);
    } catch (err) {
      console.error(`[zerxs] error handler pesan ${bot.sessionId}:`, err.message);
    }
  });
  sock.ev.on("group-participants.update", async (u) => {
    try {
      const welcome = require("./welcome");
      await welcome(sock, bot, u);
    } catch (_) {}
  });
}

/** Subscribes SSE listener */
function onEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getBot(sessionId) {
  return bots.get(sessionId) || null;
}

function onlineCount() {
  return Array.from(bots.values()).filter((b) => b.status === "online").length;
}

/** Restore sesi lama saat server menyala (tanpa spam log). */
async function restoreSessions() {
  const dir = config.pairing.folderSessions;
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const creds = path.join(dir, e.name, "creds.json");
    if (!fs.existsSync(creds)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(creds, "utf8"));
      const noiseKey = parsed.noiseKey && parsed.noiseKey.priv;
      if (!noiseKey) continue; // belum pair
      await startPairing({
        sessionId: e.name,
        botNumber: "",
        botName: config.botName,
        type: "biasa",
        owner: "",
      });
    } catch (_) {}
  }
  void fetchLatestBootstrapConfig;
}

module.exports = {
  startPairing,
  requestPairingCode,
  getQr,
  stopBot,
  listLocal,
  onEvent,
  getBot,
  onlineCount,
  restoreSessions,
  sanitizeNumber,
};

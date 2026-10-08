// ============================================================
// ZerxsBot - index.js
// WhatsApp Bot (@whiskeysockets/baileys) + Web Pairing Server
// ============================================================
const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

const config = require("./config");
const pairingState = require("./lib/pairingState");
const { handleCommand } = require("./handler/commands");
const startWebServer = require("./web/server");

const logger = pino({ level: "warn" });

let sock = null; // instance Baileys aktif (dipakai web server untuk pairing)

async function startBot() {
  const sessionDir = config.baileys.sessionFolder;
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    printQRInTerminal: true, // QR juga tampil di terminal
    browser: ["ZerxsBot", "Chrome", "1.0.0"],
    markOnlineOnConnect: true
  });

  // ---------- Koneksi & QR ----------
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastPullResult, qr, code, creds } = update;

    if (qr) {
      pairingState.setQR(qr);
      console.log("[ZerxsBot] QR diterima. Scan lewat web panel menu Pairing atau terminal.");
    }

    // pairing code dari WA (bila tersedia otomatis)
    if (code) {
      pairingState.state.pairingCode = code;
      console.log(`[ZerxsBot] Kode pairing otomatis: ${code}`);
    }

    if (connection === "open") {
      pairingState.setConnection("online");
      pairingState.clearQR();
      console.log("✅ [ZerxsBot] Berhasil terhubung ke WhatsApp!");
    }

    if (connection === "close") {
      pairingState.setConnection("offline");
      const loggedOut = creds && creds.logoutDate && creds.logoutDate > 0;
      const reason = lastPullResult && lastPullResult.status;
      if (loggedOut || reason === DisconnectReason.loggedOut) {
        console.log("❌ Sesi logout. Hapus folder ./sessions lalu jalankan ulang & pairing lagi.");
        return;
      }
      console.log("🔄 Koneksi terputus, menyambung ulang dalam 3 detik...");
      setTimeout(startBot, 3000);
    }
  });

  // ---------- Simpan kredensial ----------
  sock.ev.on("creds.update", saveCreds);

  // ---------- Fungsi request pairing dari website ----------
  pairingState.registerPairingRequest(async (phone) => {
    if (!sock) return { ok: false, message: "Sock belum tersedia, coba lagi sebentar." };
    const clean = String(phone).replace(/[^0-9]/g, "");
    if (!clean || clean.length < 10) return { ok: false, message: "Nomor tidak valid." };
    try {
      // requestPairingCode(nomor, idAlfanumerik8Karakter)
      const reqId = "ZXR" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const kode = await Promise.race([
        sock.requestPairingCode(clean, reqId),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout request pairing code")), 30000))
      ]);
      if (kode) {
        pairingState.state.pairingCode = kode;
        pairingState.state.pairingPhone = clean;
        const out = { ok: true, message: "Kode pairing berhasil dibuat.", code: kode, phone: clean };
        pairingState.setPairingResult(out);
        return out;
      }
      const fail = { ok: false, message: "Gagal mendapatkan kode pairing. Pastikan nomor aktif di WhatsApp dan belum punya 4 perangkat tertaut." };
      pairingState.setPairingResult(fail);
      return fail;
    } catch (err) {
      const fail = { ok: false, message: "Error pairing: " + err.message };
      pairingState.setPairingResult(fail);
      return fail;
    }
  });

  // ---------- Pesan masuk ----------
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      if (!m.message) continue;
      if (m.key && m.key.fromMe) continue;               // abaikan pesan sendiri
      if (m.key && m.key.remoteJid === "status@broadcast") continue;
      pairingState.incrementMessages();
      try {
        await handleCommand(sock, m);
      } catch (err) {
        console.error("[ZerxsBot] Error menangani pesan:", err.message);
      }
    }
  });

  return sock;
}

// ---------- Jalankan bot + web server ----------
(async () => {
  try {
    await startBot();
  } catch (e) {
    console.error("Gagal memulai bot:", e.message);
    setTimeout(startBot, 5000);
  }
  startWebServer(() => sock);
  console.log(`🌐 Web pairing ZerxsBot berjalan di http://localhost:${config.web.port}`);
})();

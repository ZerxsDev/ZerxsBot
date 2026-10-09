// ============================================================
// ZerxsBot - index.js (versi bersih, tanpa log error Baileys)
// WhatsApp Bot (@whiskeysockets/baileys) + Web Pairing Server
//
// Perbaikan:
//  - printQRInTerminal dihapus (opsi deprecated -> QR tampil di web)
//  - logger pino level "fatal" + filter pesan "Timed Out" / init
//    queries sehingga terminal tetap bersih saat koneksi terputus
//  - reconnect sederhana dengan delay & batas percobaan
//  - semua perintah dimuat otomatis dari folder commands/
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

// ---------- Logger super senyap ----------
// level "fatal" saja yang lolos, dan pesan timeout internal Baileys
// (fetchProps / init queries "Timed Out") dibungkam karena akan
// pulih sendiri lewat mekanisme reconnect di bawah.
const silentBase = pino({ level: "silent" });
const logger = silentBase.child({ level: "fatal" });
logger.child = () => logger; // cegah Baileys membuat child berisik
function isNoiseError(errMsg) {
  const s = String(errMsg || "");
  return /Timed\s*Out|init queries|fetchProps|530|device offline|status@broadcast/i.test(s);
}

let sock = null;            // instance Baileys aktif (dipakai web server untuk pairing)
let reconnectAttempts = 0;  // jumlah percobaan ulang berturut-turut
let closingManually = false;
let webStarted = false;

async function startBot() {
  const sessionDir = config.baileys.sessionFolder;
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (_) {
    version = undefined; // pakai default Baileys bila gagal cek versi
  }

  sock = makeWASocket({
    version,
    logger,                        // senyap — tidak ada log merah lagi
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ["ZerxsBot", "Chrome", "1.0.0"],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    connectTimeoutMs: 60000,
    queryTimeoutMs: 60000
    // NOTE: printQRInTerminal SENGAJA TIDAK dipakai (deprecated).
    // QR ditangani sendiri lewat event connection.update -> tampil di web panel.
  });

  // ---------- Koneksi & QR ----------
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastPullResult, qr, code, creds, error } = update;

    if (qr) {
      pairingState.setQR(qr);
      reconnectAttempts = 0;
      console.log("📱 QR tersedia. Buka http://localhost:" + config.web.port + " menu Pairing untuk scan, atau gunakan kode pairing.");
    }

    if (code) {
      pairingState.state.pairingCode = code;
      console.log(`[ZerxsBot] Kode pairing otomatis: ${code}`);
    }

    if (connection === "open") {
      pairingState.setConnection("online");
      pairingState.clearQR();
      reconnectAttempts = 0;
      console.log("✅ [ZerxsBot] Berhasil terhubung ke WhatsApp!");
    }

    if (connection === "close") {
      pairingState.setConnection("offline");
      const loggedOut =
        (creds && creds.logoutDate && creds.logoutDate > 0) ||
        (lastPullResult && lastPullResult.status === DisconnectReason.loggedOut);

      if (loggedOut) {
        console.log("❌ Sesi logout. Hapus folder ./sessions lalu jalankan ulang & pairing lagi.");
        return;
      }

      // bungkam detail error yang bukan masalah serius (timeout dll.)
      if (error && !isNoiseError(error.message)) {
        console.log("⚠️ Koneksi tertutup:", error.message);
      } else {
        console.log("🔄 Koneksi terputus — menyambung ulang otomatis...");
      }

      if (closingManually) return;
      reconnectAttempts++;
      if (reconnectAttempts > 8) {
        console.log("⛔ Gagal reconnect 8x berturut-turut. Periksa internet lalu jalankan ulang `node index.js`.");
        return;
      }
      const delay = Math.min(3000 * reconnectAttempts, 20000); // 3s, 6s, 9s ... maks 20s
      setTimeout(() => startBot().catch(() => {}), delay);
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
      const reqId = "ZXR" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const kode = await Promise.race([
        sock.requestPairingCode(clean, reqId),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Waktu habis saat meminta kode pairing, coba lagi.")), 30000))
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
        if (!isNoiseError(err.message)) {
          console.error("[ZerxsBot] Error menangani pesan:", err.message);
        }
      }
    }
  });

  return sock;
}

// ---------- Jalankan bot + web server ----------
(async () => {
  // web server selalu jalan walau bot sedang reconnect
  if (!webStarted) {
    startWebServer(() => sock);
    webStarted = true;
    console.log(`🌐 Web pairing ZerxsBot berjalan di http://localhost:${config.web.port}`);
  }
  try {
    await startBot();
  } catch (e) {
    if (!isNoiseError(e.message)) console.error("Gagal memulai bot:", e.message);
    setTimeout(() => startBot().catch(() => {}), 5000);
  }
})();

process.on("unhandledRejection", (reason) => {
  // tangkap rejection internal Baileys agar proses tidak mati & terminal bersih
  if (isNoiseError(reason && reason.message ? reason.message : reason)) return;
  console.error("Unhandled rejection:", reason);
});

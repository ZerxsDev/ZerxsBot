// ============================================================
// lib/pairingState.js - State bersama antara bot & web server
// ============================================================
// Menyimpan status koneksi Baileys, QR code, dan antrian
// request pairing (nomor -> kode) dari website.
// ============================================================

const state = {
  // status koneksi bot: "connecting" | "open" | "close" | "offline" | "qr" | "logged"
  connectionStatus: "offline",
  lastUpdate: Date.now(),
  qrString: null,          // isi string QR (jika mode scan QR)
  qrGeneratedAt: null,
  pairingCode: null,       // kode pairing terakhir yang dihasilkan
  pairingPhone: null,      // nomor yang meminta pairing
  lastPairingResult: null, // { ok, message } hasil request pairing terakhir
  stats: {
    startedAt: Date.now(),
    messagesReceived: 0,
    commandsExecuted: 0
  },
  // callback untuk memicu request pairing dari web -> diisi oleh index.js
  _requestPairingFn: null
};

function setConnection(status, extra = {}) {
  // normalisasi: "open" -> "online", "close"/"offline" -> "offline"
  if (status === "open") status = "online";
  else if (status === "close" || status === "connecting" || status === "offline") status = "offline";
  state.connectionStatus = status;
  state.lastUpdate = Date.now();
  Object.assign(state, extra);
}

function setQR(qr) {
  state.qrString = qr;
  state.qrGeneratedAt = Date.now();
  state.lastUpdate = Date.now();
}

function clearQR() {
  state.qrString = null;
  state.qrGeneratedAt = null;
}

function setPairingResult(res) {
  state.lastPairingResult = { ...res, at: Date.now() };
  state.lastUpdate = Date.now();
}

function registerPairingRequest(fn) {
  state._requestPairingFn = fn;
}

async function requestPairing(phone) {
  if (typeof state._requestPairingFn !== "function") {
    return { ok: false, message: "Bot belum siap (fungsi pairing belum terdaftar)" };
  }
  return await state._requestPairingFn(phone);
}

function incrementMessages(n = 1) {
  state.stats.messagesReceived += n;
}

function incrementCommands(n = 1) {
  state.stats.commandsExecuted += n;
}

module.exports = {
  state,
  setConnection,
  setQR,
  clearQR,
  setPairingResult,
  registerPairingRequest,
  requestPairing,
  incrementMessages,
  incrementCommands
};

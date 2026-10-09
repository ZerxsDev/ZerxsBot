// ============================================================
// handler/commands.js - Router ZerxsBot (versi modular)
// Setiap perintah memiliki file JS sendiri di folder commands/
// (1 perintah = 1 file). Router hanya mencocokkan & memanggil.
// ============================================================
const config = require("../config");
const pairingState = require("../lib/pairingState");
const { getMessageBody, replyText } = require("../lib/simple");
const loader = require("../commands/_loader");

const PREFIX = config.baileys.prefix;

/**
 * Entry point — dipanggil dari index.js untuk SETIAP pesan masuk.
 * Mengembalikan true bila pesan berupa perintah yang dikenali.
 */
async function handleCommand(sock, m) {
  const text = getMessageBody(m);
  if (!text || !text.startsWith(PREFIX)) return false;

  const parts = text.trim().split(/\s+/);
  const cmdRaw = parts[0].slice(PREFIX.length).toLowerCase();
  const args = parts.slice(1);

  // muat semua file perintah (cache otomatis oleh require)
  const mod = loader.get(cmdRaw);
  if (!mod) {
    await replyText(sock, m, `❓ Perintah tidak dikenal: /${cmdRaw}\nKetik ${PREFIX}menu untuk daftar fitur.`);
    return true;
  }

  pairingState.incrementCommands();
  try {
    await mod.handle(sock, m, args);
  } catch (err) {
    console.error(`[ZerxsBot] Error perintah /${cmdRaw}:`, err.message);
    try {
      await replyText(sock, m, `⚠️ Terjadi kesalahan pada /${cmdRaw}:\n${String(err.message || err).slice(0, 300)}`);
    } catch (_) {}
  }
  return true;
}

module.exports = { handleCommand, replyText };

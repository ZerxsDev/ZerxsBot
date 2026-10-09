// /iqc [teks] - Stiker balon chat tiruan WhatsApp iPhone (foto profil + nama)
const config = require("../config");
const maker = require("../lib/maker");
const { replyText, sendSticker } = require("../lib/simple");

module.exports = {
  cmd: "iqc",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}iqc halo selamat datang di ZerxsBot`);
    await replyText(sock, m, "⏳ Membuat iPhone Chat Quote...");
    let name = m.pushName || "Pengguna";
    let avatarUrl = null;
    try { avatarUrl = await sock.profilePictureUrl(m.sender, "image"); } catch (_) {}
    const stiker = await maker.iphoneChatQuote(args.join(" "), { username: name, avatarUrl });
    await sendSticker(sock, m, stiker);
  }
};

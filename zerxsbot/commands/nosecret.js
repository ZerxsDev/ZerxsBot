// /nosecret - Reply pesan sekali lihat (view-once) untuk melihat & mengunduh medianya
const config = require("../config");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "nosecret",
  aliases: ["vo", "viewonce"],
  async handle(sock, m) {
    const ctx = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
    if (!ctx || !ctx.quotedMessage) return replyText(sock, m, `Reply pesan *sekali lihat* lalu kirim ${config.baileys.prefix}nosecret`);
    const qm = ctx.quotedMessage;
    let inner = null;
    for (const t of ["viewOnceMessage", "viewOnceMessageV2"]) {
      if (qm[t]) inner = qm[t].message || qm[t];
    }
    if (!inner) inner = qm;
    const key = Object.keys(inner).find(k => ["imageMessage", "videoMessage"].includes(k));
    if (!key) return replyText(sock, m, "Pesan yang dibalas bukan pesan sekali lihat (view-once).");
    const mediaMsg = inner[key];
    const isVideo = key === "videoMessage";
    const buf = await sock.downloadMediaMessage({ message: inner }, isVideo ? "video" : "image", { timeout: 60000 });
    const caption = `👁️ *Pesan Sekali Lihat berhasil disimpan*\n${mediaMsg.caption || "(tanpa caption)"}\n${config.watermark}`;
    if (isVideo) await sock.sendMessage(m.chat, { video: buf, caption }, { quoted: m });
    else await sock.sendMessage(m.chat, { image: buf, caption }, { quoted: m });
  }
};

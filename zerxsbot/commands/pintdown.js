// /pintdown [url] - Download media Pinterest (gambar/video/slideshow)
const config = require("../config");
const dl = require("../lib/downloader");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "pintdown",
  aliases: ["pinterest", "pin"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}pintdown https://pin.it/xxxx`);
    const url = args[0];
    if (!/pinterest|pin\.it/i.test(url)) return replyText(sock, m, "URL harus link Pinterest.");
    await replyText(sock, m, "⏳ Mengunduh media Pinterest...");
    const r = await dl.pintdl(url);
    if (r.type === "images") {
      for (const b of r.buffers) {
        await sock.sendMessage(m.chat, { image: b, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
      }
    } else if (r.type === "video") {
      await sock.sendMessage(m.chat, { video: r.buffer, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, { image: r.buffer, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
    }
  }
};

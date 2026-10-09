// /ttdown [url] [mp3|mp4] - Download video/audio TikTok (tanpa watermark)
const config = require("../config");
const dl = require("../lib/downloader");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "ttdown",
  aliases: ["tt"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}ttdown https://vt.tiktok.com/xxxx mp4`);
    const url = args[0];
    let type = (args[1] || "mp4").toLowerCase();
    if (!["mp3", "mp4"].includes(type)) type = "mp4";
    if (!/tiktok\.com/i.test(url)) return replyText(sock, m, "URL harus link TikTok.");
    await replyText(sock, m, `⏳ Mengunduh ${type.toUpperCase()} dari TikTok...`);
    const r = await dl.ttdl(url, type);
    if (type === "mp3") {
      await sock.sendMessage(m.chat, {
        audio: r.buffer, mimetype: "audio/mpeg", ptt: false,
        fileName: "tiktok-audio.mp3",
        caption: `🎵 ${r.title}\n${config.watermark}`
      }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, {
        video: r.buffer,
        caption: `🎬 ${r.title}\nBy: ${r.author || "-"}\n${config.watermark}`,
        mimetype: "video/mp4"
      }, { quoted: m });
    }
  }
};

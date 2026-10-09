// /ytdown [url] [mp3|mp4] - Download video/audio YouTube
const config = require("../config");
const dl = require("../lib/downloader");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "ytdown",
  aliases: ["yt"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}ytdown https://youtu.be/xxxx mp4`);
    const url = args[0];
    let type = (args[1] || "mp4").toLowerCase();
    if (!["mp3", "mp4"].includes(type)) type = "mp4";
    if (!/youtu\.?be/.test(url)) return replyText(sock, m, "URL harus link YouTube.");
    await replyText(sock, m, `⏳ Mengunduh ${type.toUpperCase()} dari YouTube...`);
    const r = await dl.ytdl(url, type);
    if (type === "mp3") {
      await sock.sendMessage(m.chat, {
        audio: r.buffer, mimetype: "audio/mpeg", ptt: false,
        fileName: (r.title || "audio") + ".mp3",
        caption: `🎵 ${r.title}\n${config.watermark}`
      }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, {
        video: r.buffer,
        caption: `🎬 ${r.title}\nDurasi: ${r.duration}s\n${config.watermark}`,
        mimetype: "video/mp4"
      }, { quoted: m });
    }
  }
};

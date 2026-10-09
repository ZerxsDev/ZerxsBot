// /imageai [prompt] - Membuat gambar dari AI (OpenRouter)
const config = require("../config");
const openrouter = require("../lib/openrouter");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "imageai",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}imageai kucing astronot di bulan, gaya realistis`);
    await replyText(sock, m, "⏳ Membuat gambar AI...");
    const buf = await openrouter.generateImage(args.join(" "));
    await sock.sendMessage(m.chat, {
      image: buf,
      caption: `🖼️ ${config.botName} ImageAI\nPrompt: ${args.join(" ")}`
    }, { quoted: m });
  }
};

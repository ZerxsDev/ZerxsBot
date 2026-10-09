// /ai [prompt] - Tanya jawab AI (OpenRouter)
const { replyText } = require("../lib/simple");
const openrouter = require("../lib/openrouter");
const config = require("../config");

module.exports = {
  cmd: "ai",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}ai apa itu blockchain?`);
    await replyText(sock, m, "⏳ Menanyakan ke AI...");
    const out = await openrouter.chat(args.join(" "), {
      system: "Kamu adalah ZerxsBot, asisten AI WhatsApp yang membantu. Jawab dalam bahasa yang sama dengan pertanyaan pengguna."
    });
    await replyText(sock, m, out);
  }
};

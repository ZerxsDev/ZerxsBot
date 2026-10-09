// /coder [perintah] - AI membuat kode program (OpenRouter)
const { replyText } = require("../lib/simple");
const openrouter = require("../lib/openrouter");
const config = require("../config");

module.exports = {
  cmd: "coder",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}coder buat fungsi fibonacci dalam javascript`);
    await replyText(sock, m, "⏳ AI sedang menulis kode...");
    const out = await openrouter.chat(args.join(" "), {
      system: "Kamu adalah ZerxsBot-Coder. Tulis kode program bersih, beri penjelasan singkat, gunakan code block markdown."
    });
    await replyText(sock, m, out);
  }
};

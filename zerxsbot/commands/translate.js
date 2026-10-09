// /translate [kode1] [teks...] [kode2] - Terjemahkan teks antar bahasa
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "translate",
  aliases: ["tr"],
  async handle(sock, m, args) {
    if (args.length < 3) return replyText(sock, m, `Contoh: ${config.baileys.prefix}translate id halo apa kabar en`);
    const from = args[0].toLowerCase();
    const to = args[args.length - 1].toLowerCase();
    const text = args.slice(1, -1).join(" ");
    const r = await api.translate(text, from, to);
    await replyText(sock, m, `🌐 *HASIL TERJEMAHAN*\nDari (${from}) → Ke (${to})\n\nTeks asli: ${text}\nHasil: ${r.translated}\nDeteksi bahasa: ${r.detectedLang}`);
  }
};

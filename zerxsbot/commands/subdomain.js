// /subdomain [domain] - Information gathering: daftar subdomain aktif (crt.sh)
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "subdomain",
  aliases: ["subdo"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}subdomain example.com`);
    await replyText(sock, m, "⏳ Mengumpulkan subdomain (crt.sh)...");
    const r = await api.subdomains(args[0]);
    const list = r.subdomains.slice(0, 60).map(s => "• " + s).join("\n");
    await replyText(sock, m, `🔎 *SUBDOMAIN ${r.domain}*\nDitemukan ${r.count} subdomain unik (menampilkan ${Math.min(60, r.subdomains.length)}):\n\n${list || "(tidak ada)"}\n\n${config.watermark}`);
  }
};

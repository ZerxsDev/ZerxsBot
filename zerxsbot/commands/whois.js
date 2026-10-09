// /whois [domain] - Cek informasi registrasi & kepemilikan domain
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "whois",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}whois google.com`);
    const r = await api.whois(args[0]);
    await replyText(sock, m, `🗂️ *WHOIS ${r.domain}*\n\nStatus: ${r.status}\nRegistrar: ${r.registrar}\nHandle: ${r.handle}\nNameserver: ${r.nameservers.join(", ") || "-"}\n\nEvent:\n${r.events.map(e => "• " + e).join("\n")}\n\n${config.watermark}`);
  }
};

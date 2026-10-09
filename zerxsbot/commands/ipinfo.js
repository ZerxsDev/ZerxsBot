// /ipinfo [alamat IP] - Geolokasi, ISP, organisasi & koordinat IP publik
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "ipinfo",
  aliases: ["ip"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}ipinfo 8.8.8.8`);
    const d = await api.ipinfo(args[0]);
    await replyText(sock, m, `🌍 *IP INFO ${d.query}*\n\nNegara: ${d.country} (${d.countryCode})\nWilayah: ${d.region} ${d.city || ""} ${d.zip || ""}\nISP: ${d.isp}\nOrganisasi: ${d.org}\nAS: ${d.as}\nKoordinat: ${d.lat}, ${d.lon}\nZona waktu: ${d.timezone}\n\n${config.watermark}`);
  }
};

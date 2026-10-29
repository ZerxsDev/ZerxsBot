/** /ipinfo [alamat IP] - geolokasi IP publik. */
const axios = require("axios");
const wa = require("../../lib/wa");

module.exports = {
  name: "ipinfo",
  desc: "Info geolokasi, ISP, negara dari alamat IP",
  usage: "/ipinfo [alamat IP]",
  async exec(ctx) {
    const ip = (ctx.args[0] || "").trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !/:/.test(ip))
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}ipinfo 8.8.8.8`);
    const { data } = await axios.get(`http://ip-api.com/json/${ip}?lang=id`, {
      timeout: 15000,
    });
    if (data.status !== "success")
      return wa.sendText(ctx.sock, ctx.jid, "IP tidak valid / tidak ditemukan.");
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `🛰️ *IP INFO ${ip}*\n` +
        `• Negara: ${data.countryName} (${data.countryCode})\n` +
        `• Region: ${data.regionName} / ${data.city}\n` +
        `• ISP: ${data.isp}\n• Organisasi: ${data.org}\n` +
        `• Koordinat: ${data.lat}, ${data.lon}\n• Timezone: ${data.timezone}`
    );
  },
};

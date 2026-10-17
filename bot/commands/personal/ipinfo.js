const axios = require('axios');
module.exports = {
  command: 'ipinfo',
  desc: 'Informasi geolokasi, ISP, organisasi & koordinat IP publik',
  usage: '/ipinfo [alamat IP]',
  async handler(ctx) {
    const ip = (ctx.args[0] || '').trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !/:/.test(ip)) return ctx.send(`Contoh: ${ctx.prefix}ipinfo 8.8.8.8`);
    try {
      const r = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,isp,org,as,lat,lon,timezone,proxy`, { timeout: 20000 });
      const d = r.data;
      if (d.status !== 'success') return ctx.send('❌ ' + (d.message || 'IP tidak valid'));
      await ctx.send(
        `🛰 *IP INFO ${ip}*\n` +
        `🌏 Negara: ${d.country} (${d.countryCode})\n` +
        `📍 Kota/Region: ${d.city}, ${d.region}\n` +
        `🏢 ISP: ${d.isp}\n` +
        `🏛 Organisasi: ${d.org || '-'}\n` +
        `🔗 AS: ${d.as || '-'}\n` +
        `🧭 Koordinat: ${d.lat}, ${d.lon}\n` +
        `⏰ Timezone: ${d.timezone}\n` +
        `🕵️ Proxy/Anon: ${d.proxy ? 'Ya' : 'Tidak'}`
      );
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

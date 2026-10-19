module.exports = {
  name: 'ipinfo', desc: 'Info geolokasi IP publik', usage: '/ipinfo [alamat IP]',
  async exec(ctx) {
    const ip = ctx.args[0];
    if (!ip || !/^[\d.:a-fA-F]+$/.test(ip)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}ipinfo 8.8.8.8` });
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,org,lat,lon,query`);
      const d = await res.json();
      if (d.status !== 'success') return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ ' + (d.message || 'IP tidak valid.') });
      await ctx.sock.sendMessage(ctx.chatId, { text: `🌍 IPINFO ${d.query}\n🏳️ Negara: ${d.country}\n📍 Kota: ${d.regionName} ${d.city}\n📡 ISP: ${d.isp}\n🏢 Org: ${d.org}\n🧭 Koordinat: ${d.lat}, ${d.lon}` });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};

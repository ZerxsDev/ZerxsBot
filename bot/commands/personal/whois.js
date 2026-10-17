const axios = require('axios');
module.exports = {
  command: 'whois',
  desc: 'Cek informasi registrasi & kepemilikan domain',
  usage: '/whois [domain]',
  async handler(ctx) {
    const domain = (ctx.args[0] || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !/\./.test(domain)) return ctx.send(`Contoh: ${ctx.prefix}whois example.com`);
    try {
      // RDAP (resmi & gratis)
      const tld = domain.split('.').pop();
      let url = `https://rdap.org/domain/${domain}`;
      const r = await axios.get(url, { timeout: 30000 }).catch(async () => await axios.get(`https://rdap.${tld}.org/domain/${domain}`, { timeout: 30000 }));
      const d = r.data;
      const events = (d.events || []).map((e) => `${e.eventAction}: ${e.eventDate}`).join('\n');
      const registrar = (d.entities || []).find((x) => (x.roles || []).includes('registrar'));
      const regName = registrar?.vcardHandle ? '' : (registrar?.handle || '');
      await ctx.send(
        `🌍 *WHOIS ${domain}*\n` +
        `🏷 Status: ${(d.status || []).join(', ') || '-'}\n` +
        `📆 Events:\n${events || '-'}\n` +
        `🏢 Registrar handle: ${regName || '-'}\n` +
        `🌐 Nameserver: ${(d.nameservers || []).map((n) => n.ldhName).join(', ') || '-'}`
      );
    } catch (e) { await ctx.send('Domain tidak ditemukan / RDAP gagal: ' + e.message); }
  },
};

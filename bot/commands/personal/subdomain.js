const axios = require('axios');
module.exports = {
  command: 'subdomain',
  desc: 'Information gathering - mencari daftar subdomain aktif pada domain utama',
  usage: '/subdomain [domain]',
  async handler(ctx) {
    const domain = (ctx.args[0] || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain || !/\./.test(domain)) return ctx.send(`Contoh: ${ctx.prefix}subdomain example.com`);
    try {
      const r = await axios.get('https://crt.sh/', { params: { q: `%.${domain}`, output: 'json' }, timeout: 45000 });
      const set = new Set();
      for (const row of (r.data || [])) {
        String(row.name_value || '').split('\n').forEach((n) => {
          n = n.trim().toLowerCase();
          if (n.endsWith(domain) && !n.includes('*')) set.add(n);
        });
      }
      const list = [...set].slice(0, 60);
      await ctx.send(`🔎 *SUBDOMAIN ${domain}* (${list.length} ditemukan)\n\n${list.join('\n') || 'Tidak ada data.'}`);
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

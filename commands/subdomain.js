const https = require('https');
module.exports = {
  name: 'subdomain', desc: 'Cari subdomain aktif (recon)', usage: '/subdomain [domain]',
  async exec(ctx) {
    const domain = ctx.args[0];
    if (!domain) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}subdomain example.com` });
    try {
      const data = await new Promise((resolve, reject) => {
        https.get(`https://api.hackertarget.com/hostsearch/?q=${domain}`, res => {
          let b = ''; res.on('data', d => b += d); res.on('end', () => resolve(b));
        }).on('error', reject);
      });
      const list = data.split('\n').slice(0, 30).map(l => l.split(',')[0]).filter(Boolean);
      await ctx.sock.sendMessage(ctx.chatId, { text: list.length ? `🔎 Subdomain *${domain}*:\n` + list.map(s => '• ' + s).join('\n') : '⚠️ Tidak ditemukan / limit API tercapai.' });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};

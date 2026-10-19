const net = require('net');
module.exports = {
  name: 'whois', desc: 'Info registrasi domain', usage: '/whois [domain]',
  async exec(ctx) {
    const domain = ctx.args[0];
    if (!domain) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}whois example.com` });
    try {
      const out = await new Promise((resolve, reject) => {
        const sock = net.connect(43, 'whois.arin.net', () => sock.write('n +' + domain + '\r\n'));
        let b = ''; sock.on('data', d => b += d); sock.setTimeout(8000, () => sock.end());
        sock.on('close', () => resolve(b)); sock.on('error', reject);
      });
      const key = ['OrgName','Country','OrgAbuseEmail','RegDate','ExpDate','ReferralServer'];
      const lines = out.split('\n').filter(l => key.some(k => l.startsWith(k))).slice(0, 12);
      await ctx.sock.sendMessage(ctx.chatId, { text: lines.length ? `🗂️ WHOIS *${domain}* (ARIN):\n` + lines.join('\n') : `🗂️ WHOIS *${domain}*:\n` + out.slice(0, 800) });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};

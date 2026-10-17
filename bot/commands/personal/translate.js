const axios = require('axios');
module.exports = {
  command: 'translate',
  desc: 'Menerjemahkan teks antar bahasa',
  usage: '/translate [kode negara 1] [teks...] [kode negara 2]',
  async handler(ctx) {
    // format: /translate id halo dunia en
    if (ctx.args.length < 3) return ctx.send(`Contoh: ${ctx.prefix}translate id selamat pagi en`);
    const from = ctx.args[0].toLowerCase();
    const to = ctx.args[ctx.args.length - 1].toLowerCase();
    const text = ctx.args.slice(1, -1).join(' ');
    try {
      const r = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: { client: 'gtx', sl: from, tl: to, dt: 't', q: text },
        timeout: 30000,
      });
      const out = (r.data[0] || []).map((x) => x[0]).join('');
      await ctx.send(`🌐 ${from.toUpperCase()} -> ${to.toUpperCase()}\n${out}`);
    } catch (e) { await ctx.send('Gagal menerjemahkan: ' + e.message); }
  },
};

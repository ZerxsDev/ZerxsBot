const axios = require('axios');
module.exports = {
  command: 'kurs',
  desc: 'Melihat nilai tukar mata uang negara lain',
  usage: '/kurs [mata uang negara 1] [mata uang negara 2]',
  async handler(ctx) {
    if (ctx.args.length < 2) return ctx.send(`Contoh: ${ctx.prefix}kurs USD IDR`);
    const base = ctx.args[0].toUpperCase(), target = ctx.args[1].toUpperCase();
    try {
      const r = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`, { timeout: 20000 });
      const rate = r.data.rates[target];
      if (!rate) return ctx.send('Kode mata uang tidak dikenal.');
      await ctx.send(`💱 Kurs ${base} -> ${target}\n1 ${base} = ${rate.toLocaleString('id-ID')} ${target}\n(sumber: exchangerate-api, ${new Date().toLocaleDateString('id-ID')})`);
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

const axios = require('axios');
module.exports = {
  command: 'quotes',
  desc: 'Quotes random',
  usage: '/quotes',
  async handler(ctx) {
    try {
      const r = await axios.get('https://zenquotes.io/api/random', { timeout: 20000 });
      const q = r.data[0];
      await ctx.send(`💬 *Quote*\n\n"${q.q}"\n— ${q.a}`);
    } catch (e) { await ctx.send('Gagal mengambil quotes: ' + e.message); }
  },
};

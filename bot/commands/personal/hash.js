const crypto = require('crypto');
module.exports = {
  command: 'hash',
  desc: 'Mengubah teks biasa menjadi teks hash',
  usage: '/hash [MD5|SHA256] [teks]',
  async handler(ctx) {
    const algo = (ctx.args[0] || '').toUpperCase();
    const text = ctx.args.slice(1).join(' ');
    if (!['MD5', 'SHA256'].includes(algo) || !text) {
      return ctx.send(`Contoh: ${ctx.prefix}hash MD5 halo dunia\natau ${ctx.prefix}hash SHA256 halo dunia`);
    }
    const h = crypto.createHash(algo.toLowerCase()).update(text).digest('hex');
    await ctx.send(`#️⃣ ${algo}\nTeks: ${text}\nHash: ${h}`);
  },
};

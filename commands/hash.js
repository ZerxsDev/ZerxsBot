const crypto = require('crypto');
module.exports = {
  name: 'hash', desc: 'Hash teks (MD5/SHA256)', usage: '/hash [md5|sha256] [teks]',
  async exec(ctx) {
    const algo = (ctx.args[0] || '').toLowerCase();
    const text = ctx.args.slice(1).join(' ');
    if (!['md5','sha256'].includes(algo) || !text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}hash md5 halo dunia` });
    const h = crypto.createHash(algo).update(text).digest('hex');
    await ctx.sock.sendMessage(ctx.chatId, { text: `🔐 ${algo.toUpperCase()}\n${h}` });
  },
};

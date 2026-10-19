module.exports = {
  name: 'brat', desc: 'Stiker teks gaya Brat', usage: '/brat [teks]',
  async exec(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}brat aesthetic` });
    const maker = require('../lib/maker');
    const file = maker.bratImage(text);
    if (!file) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal membuat stiker brat (butuh ImageMagick).' });
    await ctx.sock.sendMessage(ctx.chatId, { sticker: { url: file } });
  },
};

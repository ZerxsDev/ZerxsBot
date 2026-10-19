module.exports = {
  name: 'stickertext', desc: 'Buat stiker dari teks', usage: '/stickertext [teks]',
  async exec(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}stickertext halo dunia` });
    const maker = require('../lib/maker');
    const file = maker.textToImage(text, { bg: '#0f172a', fg: '#ffffff' });
    if (!file) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal membuat stiker teks (butuh ImageMagick).' });
    await ctx.sock.sendMessage(ctx.chatId, { sticker: { url: file } });
  },
};

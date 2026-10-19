module.exports = {
  name: 'iqc', desc: 'Stiker balon chat gaya iPhone', usage: '/iqc [teks]',
  async exec(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}iqc halo kak!` });
    const maker = require('../lib/maker');
    const file = maker.iqcImage(text, ctx.sender);
    if (!file) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal membuat gambar (butuh ImageMagick).' });
    const st = maker.toSticker(file) || file;
    await ctx.sock.sendMessage(ctx.chatId, { sticker: { url: st } });
  },
};

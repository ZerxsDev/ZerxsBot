module.exports = {
  command: 'stickertext',
  desc: 'Membuat stiker teks',
  usage: '/stickertext [teks]',
  async handler(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}stickertext Halo dari ZerxsBot`);
    try {
      const png = await ctx.media.textOnColor(text, '#0A1A3F');
      const webp = await ctx.media.toStickerWebP(png);
      await ctx.send({ sticker: webp });
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

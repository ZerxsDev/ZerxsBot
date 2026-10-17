module.exports = {
  command: 'brat',
  desc: 'Stiker teks gaya Brat (Charli XCX)',
  usage: '/brat [teks]',
  async handler(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}brat aman dulu bos`);
    try {
      const png = await ctx.media.bratImage(text);
      const webp = await ctx.media.toStickerWebP(png);
      await ctx.send({ sticker: webp });
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

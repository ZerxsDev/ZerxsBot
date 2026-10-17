module.exports = {
  command: 'iqc',
  desc: 'Stiker balon chat tiruan WhatsApp iPhone (dengan foto profil & nama)',
  usage: '/iqc [teks]',
  async handler(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}iqc selamat malam dunia`);
    try {
      const name = ctx.author || ctx.user.username || 'Pengguna';
      const png = await ctx.media.iqcImage(text, name);
      const webp = await ctx.media.toStickerWebP(png);
      await ctx.send({ sticker: webp });
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

module.exports = {
  command: 'sticker',
  desc: 'Membuat stiker dengan me-reply media (gambar/video)',
  usage: '/sticker (reply media)',
  async handler(ctx) {
    if (!ctx.isQuotedMedia() && !(ctx.message.imageMessage || ctx.message.videoMessage)) {
      return ctx.send(`Reply gambar/video lalu ketik ${ctx.prefix}sticker`);
    }
    try {
      const { buffer } = await ctx.downloadMedia(ctx.quoted || ctx.message);
      const webp = await ctx.media.toStickerWebP(buffer);
      await ctx.send({ sticker: webp });
    } catch (e) {
      await ctx.send('Gagal membuat stiker: ' + e.message);
    }
  },
};

module.exports = {
  name: 'sticker', desc: 'Buat stiker dengan me-reply media', usage: '/sticker (reply gambar/video)',
  async exec(ctx) {
    const target = ctx.quoted || ctx.msg;
    if (!target?.message?.imageMessage && !target?.message?.videoMessage && !target?.message?.stickerMessage) {
      return ctx.sock.sendMessage(ctx.chatId, { text: `Balas (reply) gambar/video/stiker lalu ketik ${ctx.prefix}sticker` });
    }
    const { downloadMedia } = require('../lib/media');
    const maker = require('../lib/maker');
    const dl = await downloadMedia(ctx.sock, target);
    if (!dl) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal mengunduh media.' });
    let out = dl.path;
    if (dl.mimetype.includes('image')) out = maker.toSticker(dl.path) || dl.path;
    await ctx.sock.sendMessage(ctx.chatId, { sticker: { url: out }, packName: 'ZerxsBot', packPublisher: 'zerxsdev' });
  },
};

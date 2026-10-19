module.exports = {
  name: 'bratvid', desc: 'Stiker video animasi gaya Brat', usage: '/bratvid [teks]',
  async exec(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}bratvid moving` });
    const maker = require('../lib/maker');
    const file = maker.bratVideo(text);
    if (!file) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal membuat brat video (butuh ImageMagick/ffmpeg).' });
    if (file.endsWith('.gif')) await ctx.sock.sendMessage(ctx.chatId, { sticker: { url: file } });
    else await ctx.sock.sendMessage(ctx.chatId, { video: { url: file }, gifPlayback: true });
  },
};

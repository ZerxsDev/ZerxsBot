module.exports = {
  name: 'qrcode', desc: 'Buat qrcode / barcode', usage: '/qrcode [teks/url] [qr|kode]',
  async exec(ctx) {
    const text = ctx.args.slice(0, -1).join(' ') || ctx.args[0];
    const mode = (ctx.args[ctx.args.length - 1] || '').toLowerCase();
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh:\n${ctx.prefix}qrcode https://example.com qr\n${ctx.prefix}qrcode 123456 kode` });
    const JsBarcodeAble = mode === 'kode' || mode === 'barcode' || mode === 'batang';
    const maker = require('../lib/maker');
    try {
      if (JsBarcodeAble) {
        const BWIP = require('bwip-js');
        const buf = BWIP.toBuffer({ bcid: 'code128', text, scale: 4, height: 12 });
        return ctx.sock.sendMessage(ctx.chatId, { image: buf, caption: '📊 Barcode: ' + text });
      }
      const file = await maker.qrPng(text);
      await ctx.sock.sendMessage(ctx.chatId, { image: { url: file }, caption: '🔳 QRCode: ' + text });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};

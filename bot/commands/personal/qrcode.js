const axios = require('axios');
module.exports = {
  command: 'qrcode',
  desc: 'Membuat QR Code maupun Barcode',
  usage: '/qrcode [teks/url] [qr|barcode]',
  async handler(ctx) {
    const type = (ctx.args[ctx.args.length - 1] || 'qr').toLowerCase();
    const text = ctx.args.slice(0, -1).join(' ') || ctx.args.join(' ');
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}qrcode https://zerxsbot.com qr\natau ${ctx.prefix}qrcode 123456 barcode`);
    try {
      let url;
      if (type === 'barcode') {
        url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(text)}&code=Code128`;
      } else {
        url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
      }
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      await ctx.send({ image: Buffer.from(r.data), caption: `QR/${type.toUpperCase()} untuk: ${text}` });
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

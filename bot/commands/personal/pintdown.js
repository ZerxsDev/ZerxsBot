const axios = require('axios');
module.exports = {
  command: 'pintdown',
  desc: 'Download media dari Pinterest',
  usage: '/pintdown [url]',
  async handler(ctx) {
    const url = ctx.args[0];
    if (!url || !/pinterest\./.test(url)) return ctx.send(`Contoh: ${ctx.prefix}pintdown https://pin.it/xxxxx`);
    await ctx.send('⏳ Mengunduh dari Pinterest...');
    try {
      const r = await axios.get('https://api.pinterest-download.xyz/', { params: { url }, timeout: 60000 })
        .catch(() => axios.get(`https://api.dl-faster.xyz/api/download?url=${encodeURIComponent(url)}&format=mp4`, { timeout: 60000 }));
      const d = r.data;
      const link = d.url || d.data?.url || d.downloadLink || d.link;
      if (!link) throw new Error('Media tidak ditemukan');
      const file = await axios.get(link, { responseType: 'arraybuffer', timeout: 120000 });
      const buf = Buffer.from(file.data);
      if (/video|mp4/i.test(link) || buf.readUInt32BE(4) === 0x66747970) {
        await ctx.send({ video: buf, mimetype: 'video/mp4', caption: '📌 Hasil Pinterest' });
      } else {
        await ctx.send({ image: buf, caption: '📌 Hasil Pinterest' });
      }
    } catch (e) {
      await ctx.send(`❌ Gagal mengunduh (${e.message}). Pastikan link pin publik.`);
    }
  },
};

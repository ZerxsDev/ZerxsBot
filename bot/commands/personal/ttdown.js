const axios = require('axios');
module.exports = {
  command: 'ttdown',
  desc: 'Download media dari TikTok (mp3/mp4 tanpa watermark)',
  usage: '/ttdown [url] [mp3|mp4]',
  async handler(ctx) {
    const url = ctx.args[0];
    const type = (ctx.args[1] || 'mp4').toLowerCase();
    if (!url || !/tiktok\.com/.test(url)) return ctx.send(`Contoh: ${ctx.prefix}ttdown https://vt.tiktok.com/xxxx mp4`);
    await ctx.send('⏳ Mengunduh dari TikTok...');
    try {
      const api = `https://api.dl-faster.xyz/api/download?url=${encodeURIComponent(url)}&format=${type === 'mp3' ? 'mp3' : 'mp4'}`;
      const r = await axios.get(api, { timeout: 90000 });
      const dl = r.data.downloadLink || r.data.link;
      if (!dl) throw new Error('Link tidak diperoleh');
      const file = await axios.get(dl, { responseType: 'arraybuffer', timeout: 180000 });
      const buf = Buffer.from(file.data);
      if (buf.length > 60 * 1024 * 1024) return ctx.send(`🔗 File terlalu besar, silakan unduh manual:\n${dl}`);
      await ctx.send(type === 'mp3'
        ? { audio: buf, mimetype: 'audio/mpeg', fileName: 'zerxs-tt.mp3' }
        : { video: buf, mimetype: 'video/mp4', fileName: 'zerxs-tt.mp4' });
    } catch (e) {
      await ctx.send(`❌ Gagal mengunduh (${e.message}). Coba lagi nanti atau gunakan link resmi TikTok-nya.`);
    }
  },
};

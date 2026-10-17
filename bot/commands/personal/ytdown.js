const axios = require('axios');
module.exports = {
  command: 'ytdown',
  desc: 'Download media dari YouTube (mp3/mp4)',
  usage: '/ytdown [url] [mp3|mp4]',
  async handler(ctx) {
    const url = ctx.args[0];
    const type = (ctx.args[1] || 'mp4').toLowerCase();
    if (!url || !/youtu\.be|youtube\.com/.test(url)) return ctx.send(`Contoh: ${ctx.prefix}ytdown https://youtu.be/xxxxx mp4`);
    await ctx.send('⏳ Mengunduh dari YouTube...');
    try {
      // Downloader pihak ketiga (cobalt-like public API). Jika gagal, kirim link.
      const api = `https://api.dl-faster.xyz/api/download?url=${encodeURIComponent(url)}&format=${type === 'mp3' ? 'mp3' : 'mp4'}&size=360p`;
      const r = await axios.get(api, { timeout: 90000 });
      const dl = r.data.downloadLink || r.data.link;
      if (!dl) throw new Error('Link tidak diperoleh');
      if (dl.length < 5 * 1024 * 1024) {
        const file = await axios.get(dl, { responseType: 'arraybuffer', timeout: 180000 });
        const buf = Buffer.from(file.data);
        if (buf.length > 60 * 1024 * 1024) throw new Error('File terlalu besar untuk WA (>60MB)');
        await ctx.send(type === 'mp3'
          ? { audio: buf, mimetype: 'audio/mpeg', fileName: 'zerxs-yt.mp3' }
          : { video: buf, mimetype: 'video/mp4', fileName: 'zerxs-yt.mp4' });
      } else {
        await ctx.send(`🔗 Link unduh:\n${dl}`);
      }
    } catch (e) {
      await ctx.send(`❌ Gagal mengunduh (${e.message}). Layanan downloader pihak ketiga mungkin sedang down, coba lagi nanti.`);
    }
  },
};

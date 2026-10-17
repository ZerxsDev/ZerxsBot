const axios = require('axios');
module.exports = {
  command: 'meme',
  desc: 'Mendapatkan meme secara rinci',
  usage: '/meme',
  async handler(ctx) {
    try {
      const r = await axios.get('https://meme-api.com/gimme/memes', { params: { count: 5 }, timeout: 20000 });
      const m = (r.data.memes || []).find((x) => x.url && !x.nsfw) || r.data.memes?.[0];
      if (!m) return ctx.send('Tidak ada meme saat ini.');
      const info = `🖼 *${m.title}*\n📮 Subreddit: r/${m.subreddit}\n👍 Upvotes: ${m.ups}\n✍️ Author: ${m.author}\n🔗 ${m.postLink}`;
      try {
        const img = await axios.get(m.url, { responseType: 'arraybuffer', timeout: 30000 });
        await ctx.send({ image: Buffer.from(img.data), caption: info });
      } catch (e) { await ctx.send(info + '\n(gambar tidak dapat diunduh)'); }
    } catch (e) { await ctx.send('Gagal mengambil meme: ' + e.message); }
  },
};

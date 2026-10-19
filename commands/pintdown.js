module.exports = {
  name: 'pintdown', desc: 'Download media Pinterest', usage: '/pintdown [url]',
  async exec(ctx) {
    const url = ctx.args[0];
    if (!url || !/pin\.it|pinterest\./.test(url)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}pintdown https://pin.it/xxxxx` });
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
      const html = await res.text();
      const m = html.match(/"contentUrl":"(https:[^"]+?\.(?:mp4|jpg|png|webp)[^"]*?)"/) || html.match(/property="og:image" content="(https:[^"]+)"/);
      if (!m) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Media tidak ditemukan pada halaman tersebut.' });
      const mediaUrl = m[1].replace(/\\u0026/g, '&');
      const isVideo = /\.mp4/.test(mediaUrl);
      if (isVideo) await ctx.sock.sendMessage(ctx.chatId, { video: { url: mediaUrl }, caption: '📌 Hasil unduhan Pinterest.' });
      else await ctx.sock.sendMessage(ctx.chatId, { image: { url: mediaUrl }, caption: '📌 Hasil unduhan Pinterest.' });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};

module.exports = {
  name: 'meme', desc: 'Dapatkan meme random', usage: '/meme',
  async exec(ctx) {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      const d = await res.json();
      if (!d?.url) throw new Error('tidak ada meme');
      await ctx.sock.sendMessage(ctx.chatId, { image: { url: d.url }, caption: `😂 *${d.title}*\n📍 r/${d.subreddit} • 👍 ${d.ups}` });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Meme sedang tidak tersedia.' }); }
  },
};

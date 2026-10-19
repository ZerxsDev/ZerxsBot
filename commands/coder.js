module.exports = {
  name: 'coder', desc: 'Membuat kode program dari AI', usage: '/coder [permintaan kode]',
  async exec(ctx) {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}coder buat rest api node.js express` });
    const ai = require('../lib/ai');
    const r = await ai.chat([
      { role: 'system', content: 'Kamu ZerxsBot Coder. Tulis kode program yang rapi, beri penjelasan singkat, gunakan code block markdown.' },
      { role: 'user', content: prompt },
    ], 'ai');
    await ctx.sock.sendMessage(ctx.chatId, { text: r.ok ? r.content : '⚠️ ' + r.message });
  },
};

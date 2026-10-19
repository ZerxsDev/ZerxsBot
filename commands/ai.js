module.exports = {
  name: 'ai',
  desc: 'Tanya jawab dengan AI (DeepSeek)',
  usage: '/ai [prompt]',
  async exec(ctx) {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}ai apa itu quantum computing?` });
    const ai = require('../lib/ai');
    const r = await ai.chat([
      { role: 'system', content: 'Kamu ZerxsBot, asisten AI yang membantu, menjawab dalam bahasa yang sama dengan user. Gunakan WhatsApp formatting (*bold*, _italic_) seperlunya.' },
      { role: 'user', content: prompt },
    ], 'ai');
    await ctx.sock.sendMessage(ctx.chatId, { text: r.ok ? r.content : '⚠️ ' + r.message });
  },
};

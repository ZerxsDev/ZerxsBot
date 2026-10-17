module.exports = {
  command: 'ai',
  desc: 'Bertanya / meminta jawaban kepada AI (DeepSeek via OpenRouter)',
  usage: '/ai [prompt]',
  async handler(ctx) {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.send(`Contoh: ${ctx.prefix}ai apa itu quantum computing?`);
    await ctx.send('🤖 Memproses dengan AI...');
    const ans = await ctx.ai.chat([
      { role: 'system', content: `Kamu adalah ${ctx.config.bot.name}, asisten AI berbahasa Indonesia yang membantu, singkat & jelas.` },
      { role: 'user', content: prompt },
    ]);
    await ctx.send(ans);
  },
};

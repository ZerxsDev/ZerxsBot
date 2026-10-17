module.exports = {
  command: 'info',
  desc: 'Info bot secara rinci',
  usage: '/info',
  async handler(ctx) {
    const c = ctx.config;
    await ctx.send(
      `ℹ️ *ZerxsBot Info*\n` +
      `🤖 Nama: ${c.bot.name}\n` +
      `📛 Versi: ${c.bot.version}\n` +
      `👨‍💻 Developer: ${c.bot.author}\n` +
      `⚙️ Library: @whiskeysockets/baileys (Node.js)\n` +
      `🧠 AI: OpenRouter (${c.openrouter.mainModel})\n` +
      `✉️ Telegram: ${c.social.telegram}\n` +
      `📅 Sesi kamu: ${new Date().toLocaleString('id-ID')}\n` +
      `🎖 Role: ${ctx.user.role} (exp: ${ctx.user.expired})`
    );
  },
};

module.exports = {
  command: 'menu',
  desc: 'Membuka menu bot',
  usage: '/menu',
  async handler(ctx) {
    const all = ctx.roles.PERSONAL_COMMANDS;
    const allowed = all.filter((c) => ctx.roles.canUseCommand(ctx.user, c));
    const lines = allowed.map((c) => `${ctx.prefix}${c}`);
    await ctx.send(
      `╭━━━ *${ctx.config.bot.name} MENU* ━━━╮\n` +
      `👤 ${ctx.user.username} | 🎖 ${ctx.user.role}\n` +
      `📦 Kuota harian: ${Number.isFinite(ctx.roles.dailyQuota(ctx.user)) ? ctx.roles.dailyQuota(ctx.user) + 'x' : 'Unlimited'}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      lines.join('\n') +
      `\n━━━━━━━━━━━━━━━━━━\nKetik ${ctx.prefix}tutor untuk cara pakai.`
    );
  },
};

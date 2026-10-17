module.exports = {
  command: 'welcome',
  desc: 'Sambutan otomatis untuk member baru (khusus admin)',
  usage: '/welcome [on|off]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    const state = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(state)) return ctx.send(`Gunakan: ${ctx.prefix}welcome on/off`);
    ctx.engine._groupCfg(ctx.chatJid).welcome = state === 'on';
    await ctx.send(`🤝 Welcome *${state.toUpperCase()}*.`);
  },
};

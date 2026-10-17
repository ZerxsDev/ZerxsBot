module.exports = {
  command: 'antitoxic',
  desc: 'Hapus pesan kata kasar + mute pengirim 1 hari (khusus admin)',
  usage: '/antitoxic [on|off]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    const state = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(state)) return ctx.send(`Gunakan: ${ctx.prefix}antitoxic on/off`);
    ctx.engine._groupCfg(ctx.chatJid).antitoxic = state === 'on';
    await ctx.send(`🚫 Antitoxic *${state.toUpperCase()}* untuk grup ini.`);
  },
};

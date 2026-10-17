module.exports = {
  command: 'antilink',
  desc: 'Hapus pesan berisi link + mute pengirim 1 hari (khusus admin)',
  usage: '/antilink [on|off]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    const state = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(state)) return ctx.send(`Gunakan: ${ctx.prefix}antilink on/off`);
    ctx.engine._groupCfg(ctx.chatJid).antilink = state === 'on';
    await ctx.send(`🔗 Antilink *${state.toUpperCase()}* untuk grup ini.\n(Saat ON: pesan berlink dihapus & pengirim dimute 1 hari)`);
  },
};

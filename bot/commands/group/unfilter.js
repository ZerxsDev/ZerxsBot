module.exports = {
  command: 'unfilter',
  desc: 'Menghapus suatu pesan dari list filter',
  usage: '/unfilter [name_filter]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    const name = (ctx.args[0] || '').toLowerCase();
    const gs = ctx.engine._groupCfg(ctx.chatJid);
    const before = gs.filters.length;
    gs.filters = gs.filters.filter((f) => f.name !== name);
    await ctx.send(gs.filters.length < before ? `🗑 Filter "${name}" dihapus.` : `Filter "${name}" tidak ditemukan.`);
  },
};

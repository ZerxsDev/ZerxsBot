module.exports = {
  command: 'listfilter',
  desc: 'Menampilkan daftar filter grup',
  usage: '/listfilter',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    const gs = ctx.engine._groupCfg(ctx.chatJid);
    if (!gs.filters.length) return ctx.send('Belum ada filter di grup ini.');
    await ctx.send('🗂 *DAFTAR FILTER*\n' + gs.filters.map((f, i) => `${i + 1}. ${f.name} (oleh ${f.by})`).join('\n'));
  },
};

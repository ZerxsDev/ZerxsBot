module.exports = {
  command: 'showfilter',
  desc: 'Melihat & menampilkan pesan filter ke grup',
  usage: '/showfilter [name_filter]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    const name = (ctx.args[0] || '').toLowerCase();
    const gs = ctx.engine._groupCfg(ctx.chatJid);
    const f = gs.filters.find((x) => x.name === name);
    if (!f) return ctx.send(`Filter "${name}" tidak ditemukan. Cek ${ctx.prefix}listfilter`);
    await ctx.send(`🔎 *FILTER: ${f.name}* (disimpan oleh ${f.by})\n\n${f.content}`);
  },
};

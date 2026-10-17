module.exports = {
  command: 'filter',
  desc: 'Menyaring/menyimpan pesan grup dengan nama tertentu',
  usage: '/filter [reply message] [name_filter]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    const name = (ctx.args[0] || '').toLowerCase();
    const q = ctx.quoted;
    const content = q?.conversation || q?.extendedTextMessage?.text;
    if (!name || !content) return ctx.send(`Reply pesan lalu ${ctx.prefix}filter namafilter`);
    const gs = ctx.engine._groupCfg(ctx.chatJid);
    gs.filters = gs.filters.filter((f) => f.name !== name);
    gs.filters.push({ name, content, by: ctx.user.username });
    await ctx.send(`✅ Filter "${name}" tersimpan. Lihat dengan ${ctx.prefix}showfilter ${name}`);
  },
};

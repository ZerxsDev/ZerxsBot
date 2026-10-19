const h = require('../lib/grphelper');
module.exports = {
  name: 'unfilter', desc: 'Hapus filter', usage: '/unfilter [nama_filter]', groupOnly: true,
  async exec(ctx) {
    const name = ctx.args[0];
    if (!name) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}unfilter nama_filter` });
    const g = h.getGroup(ctx.chatId);
    const idx = g.filters.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
    if (idx < 0) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Filter tidak ditemukan.' });
    g.filters.splice(idx, 1);
    await ctx.sock.sendMessage(ctx.chatId, { text: `🗑️ Filter "${name}" dihapus.` });
  },
};

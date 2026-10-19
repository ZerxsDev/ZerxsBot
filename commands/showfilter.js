const h = require('../lib/grphelper');
module.exports = {
  name: 'showfilter', desc: 'Lihat isi filter', usage: '/showfilter [nama_filter]', groupOnly: true,
  async exec(ctx) {
    const name = ctx.args[0];
    if (!name) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}showfilter nama_filter` });
    const g = h.getGroup(ctx.chatId);
    const f = g.filters.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!f) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Filter tidak ditemukan.' });
    await ctx.sock.sendMessage(ctx.chatId, { text: `📌 *FILTER: ${f.name}*\nPemicu: ${f.keys.join(', ')}\n\nIsi:\n${f.content}` });
  },
};

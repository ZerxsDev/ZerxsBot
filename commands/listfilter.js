const h = require('../lib/grphelper');
module.exports = {
  name: 'listfilter', desc: 'Daftar filter grup', usage: '/listfilter', groupOnly: true,
  async exec(ctx) {
    const g = h.getGroup(ctx.chatId);
    if (!g.filters.length) return ctx.sock.sendMessage(ctx.chatId, { text: 'Belum ada filter di grup ini.' });
    await ctx.sock.sendMessage(ctx.chatId, { text: '🗂️ *DAFTAR FILTER*\n' + g.filters.map((f,i)=>`${i+1}. ${f.name} (pemicu: ${f.keys.join(', ')})`).join('\n') });
  },
};

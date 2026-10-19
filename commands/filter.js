const h = require('../lib/grphelper');
module.exports = {
  name: 'filter', desc: 'Simpan pesan yang dibalas sebagai filter', usage: '/filter (reply pesan) [nama_filter]', groupOnly: true,
  async exec(ctx) {
    const name = ctx.args[0] || ('filter-' + (h.getGroup(ctx.chatId).filters.length + 1));
    const q = ctx.quoted;
    const content = q?.message?.conversation || q?.message?.extendedTextMessage?.text;
    if (!content) return ctx.sock.sendMessage(ctx.chatId, { text: `Reply pesan yang mau difilter lalu ketik ${ctx.prefix}filter nama_filter` });
    const g = h.getGroup(ctx.chatId);
    const keys = content.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    g.filters.push({ name, content, keys });
    await ctx.sock.sendMessage(ctx.chatId, { text: `✅ Filter "${name}" disimpan. Pemicu: ${keys.join(', ')}` });
  },
};

const h = require('../lib/grphelper');
module.exports = {
  name: 'antilink', desc: 'Hapus link & mute pengirim 1 hari (admin)', usage: '/antilink [on|off]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    const mode = (ctx.args[0] || '').toLowerCase();
    if (!['on','off'].includes(mode)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}antilink on` });
    h.getGroup(ctx.chatId).antilink = mode === 'on';
    await ctx.sock.sendMessage(ctx.chatId, { text: `🔗 Antilink *${mode.toUpperCase()}*.` });
  },
};

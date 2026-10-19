const h = require('../lib/grphelper');
module.exports = {
  name: 'antitoxic', desc: 'Hapus kata kasar & mute 1 hari (admin)', usage: '/antitoxic [on|off]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    const mode = (ctx.args[0] || '').toLowerCase();
    if (!['on','off'].includes(mode)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}antitoxic on` });
    h.getGroup(ctx.chatId).antitoxic = mode === 'on';
    await ctx.sock.sendMessage(ctx.chatId, { text: `🧨 Antitoxic *${mode.toUpperCase()}*.` });
  },
};

const h = require('../lib/grphelper');
module.exports = {
  name: 'welcome', desc: 'Sambutan otomatis member baru (admin)', usage: '/welcome [on|off]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    const mode = (ctx.args[0] || '').toLowerCase();
    if (!['on','off'].includes(mode)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}welcome on` });
    h.getGroup(ctx.chatId).welcome = mode === 'on';
    await ctx.sock.sendMessage(ctx.chatId, { text: `🎉 Welcome *${mode.toUpperCase()}*.` });
  },
};

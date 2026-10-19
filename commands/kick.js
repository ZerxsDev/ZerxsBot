const h = require('../lib/grphelper');
module.exports = {
  name: 'kick', desc: 'Keluarkan member (admin)', usage: '/kick [@user|nomor]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    let num = (ctx.args[0] || '').replace(/\D/g, '');
    if (!num && ctx.quoted) num = (ctx.quoted.key?.participant || '').split('@')[0];
    if (!num) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}kick 628123456789 (atau reply target)` });
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.chatId, [num + '@s.whatsapp.net'], 'remove');
      await ctx.sock.sendMessage(ctx.chatId, { text: `🚪 @${num} telah dikeluarkan.`, mentions: [num + '@s.whatsapp.net'] });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal kick: ' + e.message }); }
  },
};

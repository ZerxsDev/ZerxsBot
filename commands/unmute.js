const h = require('../lib/grphelper');
module.exports = {
  name: 'unmute', desc: 'Pulihkan user dari mute (admin)', usage: '/unmute [@user|nomor]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    let num = (ctx.args[0] || '').replace(/\D/g, '');
    if (!num && ctx.quoted) num = (ctx.quoted.key?.participant || '').split('@')[0];
    if (!num) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}unmute 628123456789` });
    const jid = num + '@s.whatsapp.net';
    try {
      delete h.getGroup(ctx.chatId).mutes[jid];
      await ctx.sock.groupSettingUpdate(ctx.chatId, 'not_announcement');
      await ctx.sock.sendMessage(ctx.chatId, { text: `🔊 @${num} dipulihkan.`, mentions: [jid] });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal unmute: ' + e.message }); }
  },
};

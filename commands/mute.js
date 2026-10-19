const h = require('../lib/grphelper');
module.exports = {
  name: 'mute', desc: 'Bungkam user (admin)', usage: '/mute [@user|nomor]', groupOnly: true,
  async exec(ctx) {
    if (!(await h.isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Khusus admin grup.' });
    let num = (ctx.args[0] || '').replace(/\D/g, '');
    if (!num && ctx.quoted) num = (ctx.quoted.key?.participant || '').split('@')[0];
    if (!num) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}mute 628123456789` });
    const jid = num + '@s.whatsapp.net';
    try {
      await ctx.sock.groupSettingUpdate(ctx.chatId, 'announcement'); // mute grup global
      h.getGroup(ctx.chatId).mutes[jid] = Date.now() + 24*3600*1000;
      await ctx.sock.sendMessage(ctx.chatId, { text: `🔇 @${num} dibisukan selama 1 hari.`, mentions: [jid] });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal mute: ' + e.message }); }
  },
};

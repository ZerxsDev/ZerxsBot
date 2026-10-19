module.exports = {
  name: 'tag', desc: 'Tag 1 user di grup', usage: '/tag [@user | nomor]', groupOnly: true,
  async exec(ctx) {
    let num = (ctx.args[0] || '').replace(/\D/g, '');
    if (!num && ctx.quoted) num = (ctx.quoted.key?.participant || ctx.quoted.key?.remoteJid || '').split('@')[0];
    if (!num) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}tag 628123456789 atau reply orang lalu ${ctx.prefix}tag` });
    const jid = num + '@s.whatsapp.net';
    await ctx.sock.sendMessage(ctx.chatId, { text: `🏷️ @${num}`, mentions: [jid] });
  },
};

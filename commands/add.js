const config = require('../config');
module.exports = {
  name: 'add', desc: 'Tambah member ke grup (khusus admin)', usage: '/add [number]', groupOnly: true,
  async exec(ctx) {
    if (!(await isStaff(ctx))) return ctx.sock.sendMessage(ctx.chatId, { text: '⛔ Perintah ini khusus admin grup.' });
    const num = (ctx.args[0] || '').replace(/\D/g, '');
    if (!num) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}add 628123456789` });
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.chatId, [num + '@s.whatsapp.net'], 'add');
      await ctx.sock.sendMessage(ctx.chatId, { text: `✅ @${num} berhasil ditambahkan.`, mentions: [num + '@s.whatsapp.net'] });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal menambah member: ' + e.message }); }
  },
};
async function isStaff(ctx) {
  try {
    const meta = await ctx.sock.groupMetadata(ctx.chatId);
    const p = meta.participants.find(x => x.id === (ctx.msg.key.participant || ''));
    return !!(p && p.admin);
  } catch { return false; }
}

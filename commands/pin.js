module.exports = {
  name: 'pin', desc: 'Pin pesan yang dibalas', usage: '/pin (reply pesan)', groupOnly: true,
  async exec(ctx) {
    if (!ctx.quoted) return ctx.sock.sendMessage(ctx.chatId, { text: `Reply pesan lalu ketik ${ctx.prefix}pin` });
    try {
      await ctx.sock.pinMessage([ctx.quoted.key]);
      await ctx.sock.sendMessage(ctx.chatId, { text: '📌 Pesan berhasil di-pin.' });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal pin: ' + e.message }); }
  },
};

module.exports = {
  command: 'pin',
  desc: 'Pin/menyematkan pesan (reply pesan yang mau di-pin)',
  usage: '/pin (reply message)',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    if (!ctx.quoted) return ctx.send(`Reply pesan lalu ketik ${ctx.prefix}pin`);
    try {
      await ctx.botEntry.sock.sendMessage(ctx.chatJid, {
        pin: 3,
        mode: 'pin',
        messages: [ctx.raw.message.extendedTextMessage?.contextInfo?.stanzaId].filter(Boolean),
      });
      await ctx.send('📌 Pesan telah disematkan.');
    } catch (e) { await ctx.send('Gagal pin: ' + e.message); }
  },
};

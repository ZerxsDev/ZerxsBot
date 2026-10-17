module.exports = {
  command: 'unmute',
  desc: 'Pulihkan user dari mute (khusus admin)',
  usage: '/unmute [@user]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    try {
      await ctx.botEntry.sock.groupSettingUpdate(ctx.chatJid, 'not_announcement');
      await ctx.send('🔊 Grup dibuka kembali, semua member dapat mengirim pesan.');
    } catch (e) { await ctx.send('Gagal unmute: ' + e.message); }
  },
};

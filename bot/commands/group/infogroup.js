module.exports = {
  command: 'infogroup',
  desc: 'Menampilkan info grup secara rinci',
  usage: '/infogroup',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    const m = await ctx.botEntry.sock.groupMetadata(ctx.chatJid);
    const admins = m.participants.filter((p) => p.admin).length;
    await ctx.send(
      `📊 *INFO GRUP*\n` +
      `🏷 Nama: ${m.subject}\n` +
      `🆔 JID: ${m.id}\n` +
      `📝 Deskripsi: ${m.desc || '-'}\n` +
      `👥 Member: ${m.participants.length}\n` +
      `🛡 Admin: ${admins}\n` +
      `📅 Dibuat: ${new Date(m.creation * 1000).toLocaleString('id-ID')}\n` +
      `🔗 Owner: ${(m.owner || '-').split('@')[0]}`
    );
  },
};

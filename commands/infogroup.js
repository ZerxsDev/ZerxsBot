module.exports = {
  name: 'infogroup', desc: 'Info detail grup', usage: '/infogroup', groupOnly: true,
  async exec(ctx) {
    const meta = await ctx.sock.groupMetadata(ctx.chatId);
    const admins = meta.participants.filter(p => p.admin).length;
    await ctx.sock.sendMessage(ctx.chatId, { text:
`👥 *INFO GRUP*
📌 Nama: ${meta.subject}
🆔 ID: ${meta.id}
👤 Member: ${meta.participants.length} (admin: ${admins})
📝 Deskripsi: ${meta.desc || '-'}
📅 Dibuat: ${new Date(meta.creation * 1000).toLocaleString('id-ID')}` });
  },
};

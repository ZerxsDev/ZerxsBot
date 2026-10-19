module.exports = {
  name: 'tagall', desc: 'Tag semua member grup', usage: '/tagall [pesan]', groupOnly: true, adminSender: false,
  async exec(ctx) {
    const meta = await ctx.sock.groupMetadata(ctx.chatId);
    const msg = ctx.args.join(' ') || 'Tidak ada pesan.';
    const mentions = meta.participants.map(p => p.id);
    const text = `📢 *TAGALL*\n${msg}\n\n` + mentions.map(m => '• @' + m.split('@')[0]).join('\n');
    await ctx.sock.sendMessage(ctx.chatId, { text, mentions });
  },
};

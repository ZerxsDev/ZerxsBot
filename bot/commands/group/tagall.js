module.exports = {
  command: 'tagall',
  desc: 'Tag semua member grup',
  usage: '/tagall [pesan]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    const meta = await ctx.botEntry.sock.groupMetadata(ctx.chatJid);
    const msg = ctx.args.join(' ') || 'Perhatian semua member!';
    const mentions = meta.participants.map((p) => p.id);
    const text = `📢 *TAG ALL*\n${msg}\n\n` + mentions.map((m, i) => `${i + 1}. @${m.split('@')[0]}`).join('\n');
    await ctx.send({ text, mentions });
  },
};

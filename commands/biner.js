module.exports = {
  name: 'biner', desc: 'Teks ke biner', usage: '/biner [teks]',
  async exec(ctx) {
    const text = ctx.args.join(' ');
    if (!text) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}biner halo` });
    const b = [...text].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    await ctx.sock.sendMessage(ctx.chatId, { text: `🔢 Biner:\n${b}` });
  },
};

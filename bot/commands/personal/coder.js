module.exports = {
  command: 'coder',
  desc: 'Membuat kode program dari AI',
  usage: '/coder [permintaan kode]',
  async handler(ctx) {
    const req = ctx.args.join(' ').trim();
    if (!req) return ctx.send(`Contoh: ${ctx.prefix}coder buat fungsi fibonacci javascript`);
    await ctx.send('💻 AI sedang menulis kode...');
    const ans = await ctx.ai.chat([
      { role: 'system', content: 'Kamu programmer expert. Berikan kode lengkap, rapi, beri komentar singkat, dan gunakan code block markdown.' },
      { role: 'user', content: req },
    ]);
    await ctx.send(ans);
  },
};

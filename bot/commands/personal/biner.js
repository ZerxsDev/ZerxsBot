module.exports = {
  command: 'biner',
  desc: 'Menerjemahkan teks biasa menjadi teks biner',
  usage: '/biner [teks]',
  async handler(ctx) {
    const text = ctx.args.join(' ');
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}biner hello`);
    const bin = [...text].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    await ctx.send(`🔢 Biner dari "${text}":\n${bin}`);
  },
};

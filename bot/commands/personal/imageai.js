module.exports = {
  command: 'imageai',
  desc: 'Membuat gambar dari AI berdasarkan prompt',
  usage: '/imageai [prompt gambar]',
  async handler(ctx) {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.send(`Contoh: ${ctx.prefix}imageai kucing astronaut di mars, realistis`);
    await ctx.send('🎨 Membuat gambar AI... (bisa memakan waktu)');
    try {
      const img = await ctx.ai.generateImage(prompt);
      let buf;
      if (img.b64) buf = Buffer.from(img.b64, 'base64');
      else buf = await ctx.media.fetchBuffer(img.url);
      await ctx.send({ image: buf, caption: `Hasil AI untuk:\n"${prompt}"` });
    } catch (e) {
      await ctx.send('❌ Gagal membuat gambar: ' + e.message);
    }
  },
};

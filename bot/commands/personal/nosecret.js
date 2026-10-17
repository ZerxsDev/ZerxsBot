module.exports = {
  command: 'nosecret',
  desc: 'Download & lihat pesan sekali lihat (view once)',
  usage: '/nosecret (reply pesan view-once)',
  async handler(ctx) {
    const q = ctx.quoted;
    if (!q) return ctx.send(`Reply pesan 1x lihat lalu ketik ${ctx.prefix}nosecret`);
    const vo = q.viewOnceMessage || q.viewOnceMessageV2;
    const inner = vo?.message || q;
    const mediaType = ['imageMessage','videoMessage'].find((k) => inner[k]);
    if (!mediaType && !(inner.imageMessage || inner.videoMessage)) {
      return ctx.send('Pesan yang dibalas bukan pesan sekali lihat / media.');
    }
    try {
      const msgObj = inner[mediaType] ? { message: { [mediaType]: { ...inner[mediaType], viewOnce: false } } } : { message: inner };
      const buf = await ctx.botEntry.sock.downloadMediaMessage(msgObj, 'buffer', { readMessageContent: true });
      const kind = mediaType === 'videoMessage' ? 'video' : 'image';
      await ctx.send({ [kind]: buf, caption: '✅ Pesan 1x lihat berhasil dibuka & didownload oleh ZerxsBot.' });
    } catch (e) { await ctx.send('Gagal membuka pesan rahasia: ' + e.message); }
  },
};

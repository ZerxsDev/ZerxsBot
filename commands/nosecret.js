module.exports = {
  name: 'nosecret', desc: 'Unduh & lihat pesan 1x lihat', usage: '/nosecret (reply pesan view-once)',
  async exec(ctx) {
    const q = ctx.quoted;
    if (!q) return ctx.sock.sendMessage(ctx.chatId, { text: `Reply pesan 1x lihat lalu ketik ${ctx.prefix}nosecret` });
    const m = q.message || {};
    const content = m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m;
    const media = content.imageMessage || content.videoMessage;
    if (!media) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Pesan yang dibalas bukan media 1x lihat.' });
    const fake = { message: content };
    const { downloadMedia } = require('../lib/media');
    const dl = await downloadMedia(ctx.sock, fake);
    if (!dl) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal mengunduh (pesan mungkin sudah terhapus).' });
    const payload = dl.mimetype.includes('video') ? { video: { url: dl.path }, caption: '👁️ Pesan 1x lihat berhasil disimpan:' } : { image: { url: dl.path }, caption: '👁️ Pesan 1x lihat berhasil disimpan:' };
    await ctx.sock.sendMessage(ctx.chatId, payload);
  },
};

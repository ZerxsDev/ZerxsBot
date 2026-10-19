module.exports = {
  name: 'ttdown', desc: 'Download video/audio TikTok', usage: '/ttdown [url] [mp3/mp4]',
  async exec(ctx) {
    const url = ctx.args[0], fmt = (ctx.args[1] || 'mp4').toLowerCase();
    if (!url || !/tiktok\.com/.test(url)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}ttdown https://vt.tiktok.com/xxxx mp4` });
    const maker = require('../lib/maker');
    const out = maker.tmp(fmt);
    try {
      const args = fmt === 'mp3'
        ? ['-i', url, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', out]
        : ['-i', url, '-c', 'copy', out];
      require('child_process').execFileSync('yt-dlp', args.map(String), { stdio: 'ignore', timeout: 300000 });
      if (fmt === 'mp3') await ctx.sock.sendMessage(ctx.chatId, { audio: { url: out }, mimetype: 'audio/mpeg', fileName: 'zerxsbot-tiktok.mp3' });
      else await ctx.sock.sendMessage(ctx.chatId, { video: { url: out }, caption: '🎵 Hasil unduhan TikTok.' });
    } catch (e) {
      await ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal mengunduh TikTok. Pastikan yt-dlp & ffmpeg terinstal.\n' + e.message });
    }
  },
};

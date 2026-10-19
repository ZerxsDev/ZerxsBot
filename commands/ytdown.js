module.exports = {
  name: 'ytdown', desc: 'Download video/audio YouTube', usage: '/ytdown [url] [mp3/mp4]',
  async exec(ctx) {
    const url = ctx.args[0], fmt = (ctx.args[1] || 'mp4').toLowerCase();
    if (!url || !/youtu\.?be/.test(url)) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}ytdown https://youtu.be/xxxx mp4` });
    const maker = require('../lib/maker');
    const out = maker.tmp(fmt);
    try {
      const args = fmt === 'mp3'
        ? ['-i', url, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', '-t', '600', out]
        : ['-i', url, '-t', '600', '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out];
      require('child_process').execFileSync('yt-dlp', [...args.map(String)], { stdio: 'ignore', timeout: 300000 });
      if (fmt === 'mp3') await ctx.sock.sendMessage(ctx.chatId, { audio: { url: out }, mimetype: 'audio/mpeg', fileName: 'zerxsbot-mp3.mp3' });
      else await ctx.sock.sendMessage(ctx.chatId, { video: { url: out }, caption: '🎬 Hasil unduhan YouTube (durasi dibatasi ≤10 mnt).' });
    } catch (e) {
      await ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal mengunduh. Pastikan yt-dlp & ffmpeg terinstal di server.\n' + e.message });
    }
  },
};

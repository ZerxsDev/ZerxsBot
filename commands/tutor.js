const config = require('../config');
module.exports = {
  name: 'tutor', desc: 'Cara memakai perintah bot', usage: '/tutor',
  async exec(ctx) {
    await ctx.sock.sendMessage(ctx.chatId, { text:
`📖 *TUTORIAL ZERXSBOT*

1. Semua perintah diawali prefix \`${ctx.prefix}\` di chat pribadi bot.
2. Ketik ${ctx.prefix}menu untuk melihat daftar perintah sesuai role Anda.
3. Untuk fitur AI: ${ctx.prefix}ai halo | ${ctx.prefix}coder buat script python | ${ctx.prefix}imageai kucing astronaut
4. Stiker: reply gambar lalu ${ctx.prefix}sticker, atau ${ctx.prefix}bratvid teks, ${ctx.prefix}iqc teks, ${ctx.prefix}stickertext teks
5. Download: ${ctx.prefix}ytdown [url yt] [mp3/mp4], ${ctx.prefix}ttdown [url tiktok], ${ctx.prefix}pintdown [url pinterest]
6. Utilitas: ${ctx.prefix}qrcode teks qr, ${ctx.prefix}translate id teks en, ${ctx.prefix}kurs IDR USD, ${ctx.prefix}hash sha256 teks, ${ctx.prefix}biner teks
7. Keamanan grup (khusus developer): ${ctx.prefix}antilink on, ${ctx.prefix}antitoxic on, ${ctx.prefix}welcome on, ${ctx.prefix}tagall, ${ctx.prefix}kick @user
8. Kuota harian sesuai role, reset otomatis jam 00.00.
9. Butuh upgrade akses? Chat: ${config.telegram.url}` });
  },
};

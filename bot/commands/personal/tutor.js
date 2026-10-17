const LIST = [
  ['/ai [prompt]', 'Bertanya & meminta jawaban ke AI'],
  ['/imageai [prompt gambar]', 'Membuat gambar dari AI'],
  ['/coder [perintah kode]', 'Membuat kode program dari AI'],
  ['/sticker', 'Reply media -> jadikan stiker'],
  ['/qrcode [teks/url] [qr|barcode]', 'Membuat QR Code / Barcode'],
  ['/translate [kode1] [teks] [kode2]', 'Terjemahkan teks antar bahasa'],
  ['/iqc [teks]', 'Stiker balon chat ala WhatsApp iPhone'],
  ['/brat [teks]', 'Stiker teks gaya Brat'],
  ['/bratvid [teks]', 'Stiker Brat versi animasi'],
  ['/info', 'Info bot'],
  ['/stickertext [teks]', 'Stiker teks'],
  ['/meme', 'Meme random'],
  ['/nosecret', 'Reply pesan 1x lihat -> bot download & kirim'],
  ['/quotes', 'Quotes random'],
  ['/send [pesan] [no] [jumlah]', 'Kirim pesan lewat bot'],
  ['/kurs [matauang1] [matauang2]', 'Nilai tukar mata uang'],
  ['/menu', 'Menu bot'],
  ['/hash [MD5|SHA256] [teks]', 'Hash teks'],
  ['/tutor', 'Cara pakai perintah'],
  ['/subdomain [domain]', 'Cari subdomain aktif'],
  ['/whois [domain]', 'Info registrasi domain'],
  ['/ipinfo [IP]', 'Geolokasi IP publik'],
  ['/biner [teks]', 'Teks -> biner'],
  ['/ytdown [url] [mp3|mp4]', 'Download YouTube'],
  ['/ttdown [url] [mp3|mp4]', 'Download TikTok'],
  ['/pintdown [url]', 'Download Pinterest'],
];
module.exports = {
  command: 'tutor',
  desc: 'Cara memakai perintah bot',
  usage: '/tutor',
  async handler(ctx) {
    await ctx.send(
      `📖 *TUTORIAL ${ctx.config.bot.name}*\n\n` +
      LIST.map(([u, d]) => `▸ *${ctx.prefix}${u.replace(/\//, '')}*\n   ${d}`).join('\n') +
      `\n\nGroup (khusus DEVELOPER): tagall, tag, add, antilink, antitoxic, infogroup, pin, kick, welcome, mute, unmute, rules, filter, listfilter, unfilter, showfilter`
    );
  },
};

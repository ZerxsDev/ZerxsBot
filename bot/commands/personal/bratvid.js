const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

module.exports = {
  command: 'bratvid',
  desc: 'Stiker Brat versi bergerak (animasi)',
  usage: '/bratvid [teks]',
  async handler(ctx) {
    const text = ctx.args.join(' ').trim();
    if (!text) return ctx.send(`Contoh: ${ctx.prefix}bratvid halo kakak`);
    try {
      // Buat 2 frame warna bergantian -> animated webp via Jimp tidak mendukung animasi,
      // gunakan ffmpeg bila ada; fallback: stiker statis.
      const dir = path.join(os.tmpdir(), 'zerx-brat-' + Date.now());
      fs.ensureDirSync(dir);
      const frames = ['#87A96B', '#6f8f55'];
      for (let i = 0; i < 6; i++) {
        const png = await ctx.media.bratImage(text, frames[i % 2]);
        await fs.writeFile(path.join(dir, `f${i}.png`), png);
      }
      let out;
      try {
        out = path.join(dir, 'brat.webp');
        execSync(`ffmpeg -y -framerate 4 -i ${dir}/f%d.png -vf "scale=512:512" -loop 0 ${out}`, { stdio: 'ignore' });
        const buf = await fs.readFile(out);
        await ctx.send({ sticker: buf });
      } catch (e) {
        const png = await ctx.media.bratImage(text);
        const webp = await ctx.media.toStickerWebP(png);
        await ctx.send({ sticker: webp });
        await ctx.send('Catatan: animasi penuh butuh ffmpeg terinstal, dikirim versi statis.');
      }
      await fs.remove(dir).catch(() => {});
    } catch (e) { await ctx.send('Gagal: ' + e.message); }
  },
};

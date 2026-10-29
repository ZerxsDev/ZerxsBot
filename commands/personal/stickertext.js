/** /stickertext [teks] - stiker teks warna acak. */
const wa = require("../../lib/wa");
const image = require("../../lib/image");

module.exports = {
  name: "stickertext",
  desc: "Membuat stiker teks",
  usage: "/stickertext [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}stickertext halo dunia`);
    const buf = await image.stickerTextImage(ctx.text);
    await wa.sendSticker(ctx.sock, ctx.jid, buf);
  },
};

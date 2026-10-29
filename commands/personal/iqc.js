/** /iqc [teks] - tiruan chat iPhone jadi stiker. */
const wa = require("../../lib/wa");
const image = require("../../lib/image");

module.exports = {
  name: "iqc",
  desc: "Stiker balon chat tiruan iPhone",
  usage: "/iqc [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}iqc halo kak`);
    const buf = await image.iqcImage(
      ctx.text,
      ctx.pushname || ctx.user.username,
      (ctx.pushname || ctx.user.username || "Z")[0]
    );
    await wa.sendSticker(ctx.sock, ctx.jid, buf);
  },
};

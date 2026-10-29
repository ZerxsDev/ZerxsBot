/** /brat [teks] - stiker gaya Brat latar putih. */
const wa = require("../../lib/wa");
const image = require("../../lib/image");

module.exports = {
  name: "brat",
  desc: "Stiker teks gaya Brat latar putih",
  usage: "/brat [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}brat zerxsbot keren`);
    const buf = await image.bratImage(ctx.text, true);
    await wa.sendSticker(ctx.sock, ctx.jid, buf);
  },
};

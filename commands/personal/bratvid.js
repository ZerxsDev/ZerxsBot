/** /bratvid [teks] - versi animasi dari stiker Brat. */
const wa = require("../../lib/wa");
const image = require("../../lib/image");

module.exports = {
  name: "bratvid",
  desc: "Stiker video animasi gaya Brat",
  usage: "/bratvid [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}bratvid zerxsbot`);
    await wa.sendText(ctx.sock, ctx.jid, "🎬 Merender video...");
    const buf = await image.bratVideo(ctx.text);
    await wa.sendSticker(ctx.sock, ctx.jid, buf);
  },
};

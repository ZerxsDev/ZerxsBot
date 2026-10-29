/** /meme [teks] - gambar meme dengan teks. */
const wa = require("../../lib/wa");
const image = require("../../lib/image");

module.exports = {
  name: "meme",
  desc: "Membuat gambar meme",
  usage: "/meme [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}meme saat coding||saat error`);
    const [top, bottom] = ctx.text.split("||");
    const buf = await image.memeImage(top || "", bottom || "");
    await wa.sendImage(ctx.sock, ctx.jid, buf);
  },
};

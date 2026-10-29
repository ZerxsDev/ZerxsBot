/** /biner [teks] - ubah teks menjadi biner. */
const wa = require("../../lib/wa");

module.exports = {
  name: "biner",
  desc: "Mengubah teks biasa menjadi teks biner",
  usage: "/biner [teks]",
  async exec(ctx) {
    if (!ctx.text)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}biner halo`);
    const bits = ctx.text
      .split("")
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
      .join(" ");
    await wa.sendText(ctx.sock, ctx.jid, `🔢 *Biner:*\n\`${bits}\``);
  },
};

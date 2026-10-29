/** /hash [md5|sha256] [teks] - hash teks. */
const crypto = require("crypto");
const wa = require("../../lib/wa");

module.exports = {
  name: "hash",
  desc: "Mengubah teks menjadi hash",
  usage: "/hash [MD5/SHA256] [teks]",
  async exec(ctx) {
    const algo = (ctx.args[0] || "").toLowerCase();
    const teks = ctx.args.slice(1).join(" ");
    if (!["md5", "sha256"].includes(algo) || !teks)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}hash md5 halo zerxsbot`
      );
    const out = crypto.createHash(algo).update(teks).digest("hex");
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `#️⃣ *${algo.toUpperCase()}*\nTeks: ${teks}\nHash: \`${out}\``
    );
  },
};

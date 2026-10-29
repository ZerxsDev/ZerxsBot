/** /translate [kode1] [teks] [kode2] - terjemahkan via AI. */
const ai = require("../../lib/ai");
const wa = require("../../lib/wa");

module.exports = {
  name: "translate",
  desc: "Menerjemahkan teks antar bahasa",
  usage: "/translate [kode negara 1] [terjemahkan teks] [kode negara 2]",
  async exec(ctx) {
    const from = (ctx.args[0] || "").toLowerCase();
    const to = (ctx.args[ctx.args.length - 1] || "").toLowerCase();
    const teks = ctx.args.slice(1, -1).join(" ");
    if (!from || !to || !teks) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}translate id halo apa kabar en`
      );
    }
    await wa.sendText(ctx.sock, ctx.jid, "🌐 Menerjemahkan...");
    const out = await ai.chat([
      {
        role: "system",
        content: `Terjemahkan dari bahasa dengan kode '${from}' ke kode '${to}'. Keluarkan HANYA hasil terjemahan.`,
      },
      { role: "user", content: teks },
    ]);
    await wa.sendText(ctx.sock, ctx.jid, `🌐 *Hasil:* ${out}`);
  },
};

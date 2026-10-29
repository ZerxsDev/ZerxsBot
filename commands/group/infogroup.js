/** /infogroup - info rinci grup. */
const wa = require("../../lib/wa");

module.exports = {
  name: "infogroup",
  desc: "Menampilkan info grup secara rinci",
  usage: "/infogroup",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const m = await ctx.sock.groupMetadata(ctx.jid);
    const admins = m.participants.filter((p) => p.admin).length;
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `👥 *INFO GRUP*\n\n• Nama: ${m.subject}\n• ID: ${m.id}\n• Dibuat: ${new Date(m.creation * 1000).toLocaleString("id-ID")}\n• Member: ${m.participants.length}\n• Admin: ${admins}\n• Deskripsi:\n${m.desc || "-"}`
    );
  },
};

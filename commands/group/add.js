/** /add [number] - tambah member ke grup (khusus admin). */
const wa = require("../../lib/wa");

module.exports = {
  name: "add",
  desc: "Menambah member baru ke grup",
  usage: "/add [number]",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const num = String(ctx.args[0] || "").replace(/[^0-9]/g, "");
    if (!num) return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}add 628123456789`);
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [`${num}@s.whatsapp.net`], "add");
      await wa.sendText(ctx.sock, ctx.jid, `✅ Berhasil menambahkan ${num} ke grup.`);
    } catch (e) {
      await wa.sendText(ctx.sock, ctx.jid, `❌ Gagal: ${e.message}. Pastikan bot admin & nomor punya WA.`);
    }
  },
};

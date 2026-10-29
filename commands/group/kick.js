/** /kick [@user] - keluarkan member (khusus admin). */
const wa = require("../../lib/wa");

module.exports = {
  name: "kick",
  desc: "Mengeluarkan member dari grup",
  usage: "/kick [reply user]",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const target = (ci && (ci.participant || ci.remoteJid)) || null;
    if (!target) return wa.sendText(ctx.sock, ctx.jid, `Reply pesan member yang ingin dikeluarkan.`);
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], "remove");
      await wa.sendText(ctx.sock, ctx.jid, `🚪 Member ${target.split("@")[0]} telah dikeluarkan.`);
    } catch (e) {
      await wa.sendText(ctx.sock, ctx.jid, `❌ Gagal: ${e.message}`);
    }
  },
};

/** /pin [reply message] - sematkan pesan grup. */
const wa = require("../../lib/wa");

module.exports = {
  name: "pin",
  desc: "Pin/menyematkan pesan",
  usage: "/pin (reply pesan)",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const id = ci && ci.stanzaId;
    if (!id) return wa.sendText(ctx.sock, ctx.jid, `Reply pesan yang ingin di-pin.`);
    await ctx.sock.pinInChat(ctx.jid, { remoteJid: ctx.jid, fromMe: false, id });
    await wa.sendText(ctx.sock, ctx.jid, "📌 Pesan berhasil di-pin.");
  },
};

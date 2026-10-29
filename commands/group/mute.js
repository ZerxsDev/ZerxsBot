/** /mute [@user] - bungkam user (admin). */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "mute",
  desc: "Membungkam user agar tidak bisa kirim pesan",
  usage: "/mute (reply user)",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const target = ci && (ci.participant || ci.remoteJid);
    if (!target) return wa.sendText(ctx.sock, ctx.jid, "Reply pesan user yang mau di-mute.");
    const s = store.groupSettings(ctx.jid);
    s.mutes[target] = Date.now() + 24 * 3600 * 1000; // 1 hari
    store.saveGroupSettings();
    await ctx.sock.updateParticipantSettings(ctx.jid, {
      participants: [target],
      sendMessagesState: "disabled",
    }).catch(async () => {
      await wa.sendText(ctx.sock, ctx.jid, "⚠️ Mute dicatat bot (WhatsApp tidak mendukung mute individual; bot akan menghapus pesan user).");
    });
    await wa.sendText(ctx.sock, ctx.jid, `🔇 User ${target.split("@")[0]} di-mute 1 hari.`);
  },
};

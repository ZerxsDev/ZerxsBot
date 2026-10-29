/** /unmute [@user] - pulihkan user dari mute (admin). */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "unmute",
  desc: "Memulihkan user dari mute",
  usage: "/unmute (reply user)",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const target = ci && (ci.participant || ci.remoteJid);
    if (!target) return wa.sendText(ctx.sock, ctx.jid, "Reply pesan user yang mau di-unmute.");
    const s = store.groupSettings(ctx.jid);
    delete s.mutes[target];
    store.saveGroupSettings();
    await ctx.sock.updateParticipantSettings(ctx.jid, {
      participants: [target],
      sendMessagesState: "enabled",
    }).catch(() => {});
    await wa.sendText(ctx.sock, ctx.jid, `🔊 User ${target.split("@")[0]} sudah bisa mengirim pesan lagi.`);
  },
};

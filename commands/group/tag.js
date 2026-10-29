/** /tag [@user] - tag satu user (reply pesannya). */
const wa = require("../../lib/wa");

module.exports = {
  name: "tag",
  desc: "Tag 1 user di grup",
  usage: "/tag [reply user]",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const target = (ci && (ci.participant || ci.remoteJid)) || null;
    if (!target)
      return wa.sendText(ctx.sock, ctx.jid, `Reply pesan orang yang mau di-tag dengan ${ctx.prefix}tag`);
    await wa.sendText(ctx.sock, ctx.jid, `👤 @${target.split("@")[0]} ${(ctx.text || "").trim()}`.trim(), {
      contextInfo: { mentionedJid: [target] },
    });
  },
};

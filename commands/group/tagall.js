/** /tagall - tag semua member grup. */
const wa = require("../../lib/wa");

module.exports = {
  name: "tagall",
  desc: "Tag semua member grup",
  usage: "/tagall",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    const mentions = meta.participants.map((p) => p.id);
    const txt = `📢 *TAGALL ${meta.subject}*\n\n${(ctx.text || "Memanggil semua member.")}\n\nTotal member: ${mentions.length}`;
    await wa.sendText(ctx.sock, ctx.jid, txt, {
      contextInfo: { mentionedJid: mentions },
    });
  },
};

/** /coder [permintaan kode] - AI programmer. */
const ai = require("../../lib/ai");
const wa = require("../../lib/wa");

module.exports = {
  name: "coder",
  desc: "Membuat kode program dari AI",
  usage: "/coder [code perintah]",
  async exec(ctx) {
    if (!ctx.text) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}coder buat program to-do list dengan node.js express`
      );
    }
    await wa.sendText(ctx.sock, ctx.jid, "💻 Coding...");
    const answer = await ai.askCoder(ctx.text);
    await wa.sendText(ctx.sock, ctx.jid, `💻 *Code:*\n\n${answer}`);
  },
};

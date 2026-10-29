/** /imageai [prompt] - generate gambar AI. */
const ai = require("../../lib/ai");
const wa = require("../../lib/wa");

module.exports = {
  name: "imageai",
  desc: "Membuat gambar dari AI",
  usage: "/imageai [prompt gambar]",
  async exec(ctx) {
    if (!ctx.text) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}imageai kucing memakai topi astronaut`
      );
    }
    await wa.sendText(ctx.sock, ctx.jid, "🎨 Menggambar...");
    const buf = await ai.generateImage(ctx.text);
    await wa.sendImage(ctx.sock, ctx.jid, buf, `🖼️ ${ctx.text}`);
  },
};

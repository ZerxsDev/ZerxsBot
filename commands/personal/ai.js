/** /ai [prompt] - tanya jawab AI (OpenRouter deepseek). */
const ai = require("../../lib/ai");
const wa = require("../../lib/wa");

module.exports = {
  name: "ai",
  desc: "Tanya jawab dengan AI",
  usage: "/ai [prompt]",
  async exec(ctx) {
    if (!ctx.text) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}ai apa itu cryptocurrency?`
      );
    }
    await wa.sendText(ctx.sock, ctx.jid, "🤖 Memproses...");
    const answer = await ai.askAI(ctx.text);
    await wa.sendText(ctx.sock, ctx.jid, `🤖 *ZerxsBot AI:*\n\n${answer}`);
  },
};

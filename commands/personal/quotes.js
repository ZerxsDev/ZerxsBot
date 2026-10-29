/** /quotes - kutipan motivasi random via AI. */
const ai = require("../../lib/ai");
const wa = require("../../lib/wa");

const THEMES = ["kehidupan", "sukses", "cinta", "kerja keras", "waktu", "ilmu", "sabar"];

module.exports = {
  name: "quotes",
  desc: "Kutipan random",
  usage: "/quotes",
  async exec(ctx) {
    const tema = THEMES[Math.floor(Math.random() * THEMES.length)];
    const out = await ai.chat([
      {
        role: "system",
        content:
          "Kamu pembuat kutipan. Buat SATU kutipan orisinal berbahasa Indonesia bertema '" +
          tema +
          "', maksimal 200 karakter, tanpa tanda kutip, akhiri dengan nama pena fiktif.",
      },
      { role: "user", content: tema },
    ]);
    await wa.sendText(ctx.sock, ctx.jid, `💬 *Quotes ${tema}:*\n\n${out}`);
  },
};

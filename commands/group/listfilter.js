/** /listfilter - daftar filter grup. */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "listfilter",
  desc: "Menampilkan list pesan filter grup",
  usage: "/listfilter",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const s = store.groupSettings(ctx.jid);
    const keys = Object.keys(s.filters);
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      keys.length
        ? `🗂️ *Daftar Filter:*\n${keys.map((k) => "• " + k).join("\n")}`
        : "Belum ada filter di grup ini."
    );
  },
};

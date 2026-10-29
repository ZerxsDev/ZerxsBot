/** /rules - tampilkan peraturan grup. */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "rules",
  desc: "Menampilkan peraturan grup",
  usage: "/rules",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const s = store.groupSettings(ctx.jid);
    await wa.sendText(ctx.sock, ctx.jid, `📜 *PERATURAN GRUP*\n\n${s.rules}\n\nMelanggar = diblokir/mute oleh bot sampai dibuka developer.`);
  },
};

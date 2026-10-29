/** /antitoxic [on/off] - hapus kata kasar + mute 1 hari (admin). */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "antitoxic",
  desc: "Anti toxic: hapus kata kasar & mute pengirim 1 hari",
  usage: "/antitoxic [on/off]",
  settingKey: "antitoxic",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const mode = (ctx.args[0] || "").toLowerCase();
    const s = store.groupSettings(ctx.jid);
    if (mode === "on") s.antitoxic = true;
    else if (mode === "off") s.antitoxic = false;
    else return wa.sendText(ctx.sock, ctx.jid, `Pilih: ${ctx.prefix}antitoxic on | off`);
    store.saveGroupSettings();
    await wa.sendText(ctx.sock, ctx.jid, `🛡️ Antitoxic *${s.antitoxic ? "AKTIF" : "MATI"}*.`);
  },
};

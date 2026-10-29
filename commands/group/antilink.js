/** /antilink [on/off] - hapus pesan berlink + mute 1 hari (admin). */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "antilink",
  desc: "Anti link: hapus pesan link & mute pengirim 1 hari",
  usage: "/antilink [on/off]",
  settingKey: "antilink",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const mode = (ctx.args[0] || "").toLowerCase();
    const s = store.groupSettings(ctx.jid);
    if (mode === "on") s.antilink = true;
    else if (mode === "off") s.antilink = false;
    else return wa.sendText(ctx.sock, ctx.jid, `Pilih: ${ctx.prefix}antilink on | off`);
    store.saveGroupSettings();
    await wa.sendText(ctx.sock, ctx.jid, `🔗 Antilink *${s.antilink ? "AKTIF" : "MATI"}*.`);
  },
};

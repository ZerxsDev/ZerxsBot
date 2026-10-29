/** /welcome [on/off] - sambutan otomatis member baru (admin). */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "welcome",
  desc: "Sambutan otomatis untuk member baru",
  usage: "/welcome [on/off]",
  settingKey: "welcome",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const mode = (ctx.args[0] || "").toLowerCase();
    const s = store.groupSettings(ctx.jid);
    if (mode === "on") s.welcome = true;
    else if (mode === "off") s.welcome = false;
    else return wa.sendText(ctx.sock, ctx.jid, `Pilih: ${ctx.prefix}welcome on | off`);
    store.saveGroupSettings();
    await wa.sendText(ctx.sock, ctx.jid, `🎉 Welcome *${s.welcome ? "AKTIF" : "MATI"}*.`);
  },
};

/** /showfilter [name_filter] - tampilkan isi filter. */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "showfilter",
  desc: "Melihat pesan yang disaring di grup",
  usage: "/showfilter [name_filter]",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const name = (ctx.args[0] || "").toLowerCase();
    const s = store.groupSettings(ctx.jid);
    if (!name || !s.filters[name])
      return wa.sendText(ctx.sock, ctx.jid, `Filter tidak ditemukan. ${ctx.prefix}listfilter`);
    await wa.sendText(ctx.sock, ctx.jid, `🔎 *Filter ${name}:*\n\n${s.filters[name]}`);
  },
};

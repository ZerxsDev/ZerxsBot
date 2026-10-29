/** /unfilter [name_filter] - hapus filter. */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "unfilter",
  desc: "Menghapus pesan dari list filter",
  usage: "/unfilter [name_filter]",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const name = (ctx.args[0] || "").toLowerCase();
    const s = store.groupSettings(ctx.jid);
    if (!name || !s.filters[name])
      return wa.sendText(ctx.sock, ctx.jid, `Filter tidak ditemukan. ${ctx.prefix}listfilter`);
    delete s.filters[name];
    store.saveGroupSettings();
    await wa.sendText(ctx.sock, ctx.jid, `🗑️ Filter *${name}* dihapus.`);
  },
};

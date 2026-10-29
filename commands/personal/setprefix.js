/** /setprefix [prefiks] - ganti prefiks (owner: / . ! | dev/founder: / . ! # ? >). */
const wa = require("../../lib/wa");
const roles = require("../../lib/roles");
const store = require("../../lib/store");

module.exports = {
  name: "setprefix",
  desc: "Mengganti prefiks bot (khusus role tertentu)",
  usage: "/setprefix [/, ., !, #, ?, >]",
  async exec(ctx) {
    const r = roles.getRole(ctx.role);
    if (!r.canChangePrefix)
      return wa.sendText(ctx.sock, ctx.jid, "🔒 Ganti prefiks khusus role Owner ke atas.");
    const p = ctx.args[0] || "";
    const allowed = r.allowedPrefixes || ["/"];
    if (!allowed.includes(p))
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Prefiks yang tersedia untuk ${r.label}: ${allowed.join(" ")}`
      );
    store.setPrefix(ctx.sender, p);
    await wa.sendText(ctx.sock, ctx.jid, `✅ Prefiks diubah menjadi *${p}*. Contoh: ${p}menu`);
  },
};

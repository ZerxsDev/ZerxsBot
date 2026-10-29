/** /menu - daftar perintah sesuai role. */
const wa = require("../../lib/wa");

module.exports = {
  name: "menu",
  desc: "Membuka menu bot",
  usage: "/menu",
  async exec(ctx) {
    await wa.sendText(ctx.sock, ctx.jid, ctx.buildMenu());
  },
};

/** /subdomain [domain] - informasi pengumpulan subdomain (crt.sh). */
const axios = require("axios");
const wa = require("../../lib/wa");

module.exports = {
  name: "subdomain",
  desc: "Mencari daftar subdomain aktif pada domain utama",
  usage: "/subdomain [domain]",
  async exec(ctx) {
    const dom = (ctx.args[0] || "").replace(/^https?:\/\//, "").split("/")[0];
    if (!dom || !/\./.test(dom))
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}subdomain example.com`);
    await wa.sendText(ctx.sock, ctx.jid, "🔍 Mengumpulkan subdomain...");
    const { data } = await axios.get(
      `https://crt.sh/?q=%25.${dom}&output=json`,
      { timeout: 30000 }
    );
    const set = new Set();
    (Array.isArray(data) ? data : []).forEach((row) =>
      String(row.name_value || "")
        .split("\n")
        .forEach((n) => {
          if (n.endsWith(dom) || n.endsWith("." + dom)) set.add(n);
        })
    );
    const list = Array.from(set).slice(0, 60);
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      list.length
        ? `🌐 *Subdomain ${dom}* (${list.length}):\n\n${list.map((x) => "• " + x).join("\n")}`
        : `Tidak ditemukan subdomain publik untuk ${dom}.`
    );
  },
};

/** /kurs [mata uang 1] [mata uang 2] - nilai tukar (frankfurter.app ECB). */
const axios = require("axios");
const wa = require("../../lib/wa");

module.exports = {
  name: "kurs",
  desc: "Nilai tukar mata uang antar negara",
  usage: "/kurs [mata uang negara 1] [mata uang negara 2]",
  async exec(ctx) {
    const from = (ctx.args[0] || "").toUpperCase();
    const to = (ctx.args[1] || "").toUpperCase();
    if (!from || !to)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}kurs usd idr`
      );
    const { data } = await axios.get(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { timeout: 15000 }
    );
    const rate = data && data.rates && data.rates[to];
    if (rate == null)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Kode mata uang ${from}/${to} tidak ditemukan (data ECB).`
      );
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `💱 *Kurs ${from} → ${to}*\n1 ${from} = ${rate.toLocaleString("id-ID")} ${to}\n(${data.date})`
    );
  },
};

// /kurs [matauang1] [matauang2] - Nilai tukar mata uang antar negara
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "kurs",
  async handle(sock, m, args) {
    if (args.length < 2) return replyText(sock, m, `Contoh: ${config.baileys.prefix}kurs usd idr`);
    const r = await api.kurs(args[0], args[1]);
    await replyText(sock, m, `💱 *KURS ${r.from} → ${r.to}*\n\n1 ${r.from} = ${r.rate.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ${r.to}\n\n${r.examples.join("\n")}\n\nUpdate: ${r.date}\n${config.watermark}`);
  }
};

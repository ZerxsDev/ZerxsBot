// /brat [teks] - Stiker teks gaya Brat (Charli XCX)
const config = require("../config");
const maker = require("../lib/maker");
const { replyText, sendSticker } = require("../lib/simple");

module.exports = {
  cmd: "brat",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}brat zerxsbot keren`);
    const stiker = await maker.brat(args.join(" "));
    await sendSticker(sock, m, stiker);
  }
};

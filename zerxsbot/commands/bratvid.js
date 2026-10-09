// /bratvid [teks] - Versi animasi bergerak dari stiker Brat
const config = require("../config");
const maker = require("../lib/maker");
const { replyText, sendSticker } = require("../lib/simple");

module.exports = {
  cmd: "bratvid",
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}bratvid zerxsbot keren`);
    await replyText(sock, m, "⏳ Membuat video Brat animasi...");
    const vid = await maker.bratVideo(args.join(" "));
    await sendSticker(sock, m, vid);
  }
};

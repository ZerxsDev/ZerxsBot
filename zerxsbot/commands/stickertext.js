// /stickertext [teks] - Membuat stiker teks
const config = require("../config");
const maker = require("../lib/maker");
const { replyText, sendSticker } = require("../lib/simple");

module.exports = {
  cmd: "stickertext",
  aliases: ["sw", "textsticker"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}stickertext halo dunia`);
    const stiker = await maker.stickerText(args.join(" "));
    await sendSticker(sock, m, stiker);
  }
};

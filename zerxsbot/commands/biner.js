// /biner [teks] - Teks -> biner (0/1), dan biner -> teks bila arg deretan 0/1
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "biner",
  aliases: ["binary"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${config.baileys.prefix}biner halo`);
    const joined = args.join(" ");
    // mode decode: input berupa deretan 0 dan 1
    if (/^[01\s]+$/.test(joined.trim())) {
      return replyText(sock, m, `🔤 *BINER → TEKS*\n\nHasil: ${api.fromBinary(joined)}`);
    }
    const bin = api.toBinary(joined);
    await replyText(sock, m, `🔢 *TEKS → BINER*\n\nTeks: ${joined}\nBiner: ${bin}`);
  }
};

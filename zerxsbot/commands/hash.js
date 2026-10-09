// /hash [MD5|SHA256] [teks] - Mengubah teks menjadi hash
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "hash",
  async handle(sock, m, args) {
    if (args.length < 2) return replyText(sock, m, `Contoh:\n${config.baileys.prefix}hash md5 halozerxs\n${config.baileys.prefix}hash sha256 halozerxs`);
    const algo = args[0];
    const text = args.slice(1).join(" ");
    const r = api.hashText(algo, text);
    await replyText(sock, m, `#️⃣ *HASH ${r.algo}*\n\nTeks: ${text}\nHasil: ${r.hash}`);
  }
};

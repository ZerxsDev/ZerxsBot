// /quotes - Quotes random
const config = require("../config");
const api = require("../lib/api");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "quotes",
  aliases: ["quote"],
  async handle(sock, m) {
    const q = await api.randomQuote();
    await replyText(sock, m, `💬 *QUOTES*\n\n"${q.quote}"\n\n— ${q.author} (${q.source})`);
  }
};

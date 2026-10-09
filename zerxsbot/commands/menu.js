// /menu - Membuka menu bot
const menu = require("../lib/menu");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "menu",
  aliases: ["help", "start"],
  async handle(sock, m) {
    await replyText(sock, m, menu.menuText(m.pushName));
  }
};

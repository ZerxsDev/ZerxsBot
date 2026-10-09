// /tutor - Tutorial cara memakai semua perintah bot
const menu = require("../lib/menu");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "tutor",
  async handle(sock, m) {
    await replyText(sock, m, menu.tutorText());
  }
};

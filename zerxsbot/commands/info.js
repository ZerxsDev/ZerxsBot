// /info - Info rinci tentang bot
const menu = require("../lib/menu");
const pairingState = require("../lib/pairingState");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "info",
  async handle(sock, m) {
    const s = pairingState.state;
    const uptimeMs = Date.now() - s.stats.startedAt;
    const up = `${Math.floor(uptimeMs / 3600000)}j ${Math.floor((uptimeMs % 3600000) / 60000)}m ${Math.floor((uptimeMs % 60000) / 1000)}d`;
    await replyText(sock, m, menu.infoText({
      status: s.connectionStatus,
      messages: s.stats.messagesReceived,
      commands: s.stats.commandsExecuted,
      uptime: up
    }));
  }
};

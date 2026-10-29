/** /info - info rinci tentang bot. */
const config = require("../../config");
const wa = require("../../lib/wa");
const roles = require("../../lib/roles");

module.exports = {
  name: "info",
  desc: "Info bot secara rinci",
  usage: "/info",
  async exec(ctx) {
    const r = roles.getRole(ctx.role);
    const txt =
      `ℹ️ *${config.botName} ${config.version}*\n\n` +
      `• Developer: ZerxsDev (${config.contacts.telegram})\n` +
      `• Saluran WA: ${config.contacts.waChannel}\n` +
      `• Engine: @whiskeysockets/baileys + Node.js\n` +
      `• AI: OpenRouter (deepseek)\n` +
      `• Database: Google Spreadsheet\n\n` +
      `👤 *Akun kamu*\n` +
      `• Username: ${ctx.user.username}\n` +
      `• Role: ${r.label}\n` +
      `• Kuota harian: ${Number.isFinite(r.dailyQuota) ? r.dailyQuota + "x (reset 00.00)" : "Unlimited"}\n` +
      `• Maksimal bot: ${Number.isFinite(r.maxBots) ? r.maxBots : "Unlimited"}\n` +
      `• Expired: ${roles.expiredText(ctx.user.expired)}`;
    await wa.sendText(ctx.sock, ctx.jid, txt);
  },
};

const config = require('../config');
module.exports = {
  name: 'info', desc: 'Info bot secara rinci', usage: '/info',
  async exec(ctx) {
    const uptime = Math.floor(process.uptime());
    await ctx.sock.sendMessage(ctx.chatId, { text:
`ℹ️ *ZerxsBot Info*
🤖 Nama: ${config.bot.name}
📦 Versi: 1.0.0
🔣 Prefix aktif: \`${ctx.prefix}\`
⏱️ Uptime: ${Math.floor(uptime/3600)}j ${Math.floor(uptime%3600/60)}m ${uptime%60}d
🧩 Total perintah: ${Object.keys(require('../handler').commands).length}
🌐 AI: OpenRouter (${config.openrouter.model.ai})
👨‍💻 Developer: ${config.telegram.url}
💾 Database: Google Spreadsheet via Apps Script` });
  },
};

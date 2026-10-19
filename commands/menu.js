const state = require('../lib/state');
const config = require('../config');
module.exports = {
  name: 'menu', desc: 'Menu perintah bot', usage: '/menu',
  async exec(ctx) {
    const cmds = require('../handler').commands;
    const allowed = state.allowedCommands(ctx.role || 'member');
    const personal = Object.values(cmds).filter(c => !c.groupOnly && (allowed.includes('*') || allowed.includes(c.name)));
    const lines = personal.map(c => `${ctx.prefix}${c.usage}`);
    let txt = `╭───🤖 *ZERXSBOT MENU*───\n│ Prefix: \`${ctx.prefix}\`\n│ Role: *${ctx.role || 'member'}*\n├──────────────────────\n`;
    txt += lines.join('\n') + '\n';
    if (state.isGroupCommandAllowed(ctx.role)) {
      const groupCmds = Object.values(cmds).filter(c => c.groupOnly);
      txt += '├── *PERINTAH GRUP* ──\n' + groupCmds.map(c => ctx.prefix + c.usage).join('\n') + '\n';
    }
    txt += '╰── 🌐 zerxsbot • 👨‍💻 ' + config.telegram.url;
    await ctx.sock.sendMessage(ctx.chatId, { text: txt });
  },
};

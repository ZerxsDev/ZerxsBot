/** /tutor - panduan memakai perintah bot. */
const wa = require("../../lib/wa");
const roles = require("../../lib/roles");

module.exports = {
  name: "tutor",
  desc: "Cara memakai perintah bot",
  usage: "/tutor",
  async exec(ctx) {
    const list = roles.getAllCommands().filter((c) => roles.canUseCommand(ctx.role, c.name));
    let txt = `📖 *TUTORIAL ${ctx.prefix}PERINTAH*\n\n`;
    list.forEach((c) => {
      txt += `▸ ${c.usage.replace("/", ctx.prefix)}\n   _${c.desc}_\n`;
    });
    txt += `\nCatatan: gunakan prefiks ${ctx.prefix} di awal. Salah perintah? Bot akan mengingatkan.`;
    await wa.sendText(ctx.sock, ctx.jid, txt);
  },
};

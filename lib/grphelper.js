// Helper bersama perintah grup
const handler = require('../handler');
async function isStaff(ctx) {
  try {
    const meta = await ctx.sock.groupMetadata(ctx.chatId);
    const pid = ctx.msg.key.participant || '';
    const p = meta.participants.find(x => x.id === pid);
    return !!(p && p.admin);
  } catch { return false; }
}
module.exports = { isStaff, getGroup: handler.getGroup };

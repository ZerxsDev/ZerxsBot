/** /filter [reply message] [name_filter] - simpan pesan sebagai filter. */
const wa = require("../../lib/wa");
const store = require("../../lib/store");

module.exports = {
  name: "filter",
  desc: "Menyaring/menyimpan pesan untuk ditampilkan bot",
  usage: "/filter (reply pesan) nama_filter",
  async exec(ctx) {
    if (!ctx.isGroup) return wa.sendText(ctx.sock, ctx.jid, "Hanya bisa di dalam grup.");
    const name = (ctx.args[0] || "").toLowerCase();
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const qm = ci && ci.quotedMessage;
    const content = qm && (qm.conversation || (qm.extendedTextMessage && qm.extendedTextMessage.text));
    if (!name || !content)
      return wa.sendText(ctx.sock, ctx.jid, `Reply pesan lalu ketik: ${ctx.prefix}filter nama_filter`);
    const s = store.groupSettings(ctx.jid);
    s.filters[name] = content;
    store.saveGroupSettings();
    await wa.sendText(ctx.sock, ctx.jid, `✅ Filter *${name}* tersimpan.`);
  },
};

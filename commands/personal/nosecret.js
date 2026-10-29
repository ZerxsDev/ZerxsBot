/** /nosecret [reply] - lihat & unduh pesan view-once 1x. */
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const wa = require("../../lib/wa");

module.exports = {
  name: "nosecret",
  desc: "Melihat & mengunduh pesan sekali lihat",
  usage: "/nosecret (reply pesan 1x lihat)",
  async exec(ctx) {
    const ci =
      ctx.msg.message && ctx.msg.message.extendedTextMessage
        ? ctx.msg.message.extendedTextMessage.contextInfo
        : null;
    const qm = ci && ci.quotedMessage ? ci.quotedMessage : null;
    if (!qm)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Reply pesan *view once* dengan caption ${ctx.prefix}nosecret`
      );
    const content =
      qm.imageMessage || qm.videoMessage || qm.documentMessage || qm.audioMessage;
    if (!content || !content.url)
      return wa.sendText(ctx.sock, ctx.jid, "Pesan tersebut bukan media *view once*.");
    const type = qm.imageMessage
      ? "image"
      : qm.videoMessage
        ? "video"
        : qm.audioMessage
          ? "audio"
          : "document";
    const stream = await downloadContentFromMessage(content, type);
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    const buf = Buffer.concat(chunks);
    if (type === "image") await wa.sendImage(ctx.sock, ctx.jid, buf, "👀 Hasil 1x lihat:");
    else if (type === "video") await wa.sendVideo(ctx.sock, ctx.jid, buf);
    else if (type === "audio") await wa.sendAudio(ctx.sock, ctx.jid, buf);
    else await ctx.sock.sendMessage(ctx.jid, { document: buf, fileName: "file.bin" });
  },
};

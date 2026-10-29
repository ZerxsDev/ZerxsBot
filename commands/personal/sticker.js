/** /sticker [reply media] - media -> stiker. */
const Jimp = require("jimp");
const wa = require("../../lib/wa");

module.exports = {
  name: "sticker",
  desc: "Buat stiker dari media yang di-reply",
  usage: "/sticker (reply gambar/video)",
  async exec(ctx) {
    const q = ctx.msg.message && ctx.msg.message.extendedTextMessage
      ? ctx.msg.message.extendedTextMessage.contextInfo
      : null;
    const quotedMsg = q && q.quotedMessage ? { message: q.quotedMessage } : null;
    const source = quotedMsg || ctx.msg;
    const hasMedia =
      source.message &&
      (source.message.imageMessage ||
        source.message.videoMessage ||
        source.message.stickerMessage);
    if (!hasMedia) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Reply gambar/video/stiker dengan caption ${ctx.prefix}sticker`
      );
    }
    let buf = await wa.downloadMedia(source);
    if (!buf) throw new Error("Media gagal diunduh");
    try {
      const img = await Jimp.read(buf);
      img.resize(512, 512);
      buf = await img.getBufferAsync(Jimp.MIME_PNG);
    } catch (_) {
      /* video/dokumen: kirim apa adanya */
    }
    await wa.sendSticker(ctx.sock, ctx.jid, buf);
  },
};

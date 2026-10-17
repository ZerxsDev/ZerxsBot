/**
 * ZerxsBot - Helper untuk file command (1 perintah 1 file).
 * ctx.send(text|payload) mengirim pesan memakai sock bot yang menerima chat.
 */
function bindSend(ctx) {
  ctx.send = async (content, opt = {}) => {
    const payload = typeof content === 'string' ? { text: content } : content;
    return ctx.botEntry.sock.sendMessage(ctx.chatJid, payload, { quoted: ctx.raw, ...opt });
  };
  ctx.reply = ctx.send;

  /** Ambil buffer media dari pesan (yang di-reply atau media pada pesan itu sendiri) */
  ctx.downloadMedia = async (targetMsg = ctx.quoted || ctx.message) => {
    const mime =
      targetMsg.imageMessage?.mimetype ||
      targetMsg.videoMessage?.mimetype ||
      targetMsg.stickerMessage?.mimetype ||
      targetMsg.documentMessage?.mimetype || '';
    if (!mime) throw new Error('Tidak ada media');
    const stream = await ctx.botEntry.sock.downloadMediaMessage({ message: targetMsg }, 'buffer', { readMessageContent: true });
    return { buffer: stream, mime };
  };

  ctx.isQuotedMedia = () => {
    const q = ctx.quoted;
    return !!(q && (q.imageMessage || q.videoMessage || q.stickerMessage));
  };

  /** Kirim gambar/stiker dari buffer */
  ctx.sendImage = async (buffer, caption = '', asSticker = false) => {
    if (asSticker) {
      const webp = await ctx.media.toStickerWebP(buffer);
      return ctx.send({ sticker: webp, caption });
    }
    return ctx.send({ image: buffer, caption });
  };

  /** Admin check di grup */
  ctx.isAdmin = async () => {
    if (!ctx.isGroup) return false;
    try {
      const meta = await ctx.botEntry.sock.groupMetadata(ctx.chatJid);
      const me = ctx.sender;
      const p = meta.participants.find((x) => x.id === me);
      return p && (p.admin === 'admin' || p.admin === 'superadmin');
    } catch (e) { return false; }
  };
}

module.exports = { bindSend };

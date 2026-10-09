// ============================================================
// lib/simple.js - Utilitas sederhana ZerxsBot
// Mengambil teks dari SEMUA jenis pesan WhatsApp (termasuk
// buttons/list reply — penyebab utama "/menu tidak muncul"),
// helper reply, stiker, dan unduh media.
// ============================================================

/** Ambil teks pesan dari bentuk message selengkap mungkin */
function getMessageBody(m) {
  if (!m || !m.message) return "";
  const msg = m.message;

  // view-once / ephemeral dibungkus
  let inner = msg;
  if (msg.viewOnceMessage && msg.viewOnceMessage.message) inner = msg.viewOnceMessage.message;
  else if (msg.viewOnceMessageV2 && msg.viewOnceMessageV2.message) inner = msg.viewOnceMessageV2.message;
  else if (msg.ephemeralMessage && msg.ephemeralMessage.message) inner = msg.ephemeralMessage.message;

  if (inner.conversation) return inner.conversation;
  if (inner.extendedTextMessage && inner.extendedTextMessage.text) return inner.extendedTextMessage.text;
  // reply terhadap button / list — INI YANG DULU TERLEWAT
  if (inner.buttonsResponseMessage && inner.buttonsResponseMessage.selectedDisplayText)
    return inner.buttonsResponseMessage.selectedDisplayText;
  if (inner.listResponseMessage && inner.listResponseMessage.title)
    return inner.listResponseMessage.title;
  if (inner.templateButtonReplyMessage && inner.templateButtonReplyMessage.selectedDisplayText)
    return inner.templateButtonReplyMessage.selectedDisplayText;
  if (inner.buttonsMessage && inner.buttonsMessage.contentText) return inner.buttonsMessage.contentText;
  if (inner.imageMessage && inner.imageMessage.caption) return inner.imageMessage.caption;
  if (inner.videoMessage && inner.videoMessage.caption) return inner.videoMessage.caption;
  return "";
}

/** Balas teks ke chat */
async function replyText(sock, m, text) {
  await sock.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: require("../config").botName,
        body: require("../config").watermark,
        sourceUrl: "https://wa.me/" + require("../config").botOwnerNumber
      }
    }
  }, { quoted: m });
}

/** Kirim buffer sebagai stiker */
async function sendSticker(sock, m, buffer) {
  await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
}

/** Cari node media (image/video/sticker/document) dari sebuah message object */
function findMediaNode(obj) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of ["imageMessage", "videoMessage", "stickerMessage", "documentMessage", "audioMessage"]) {
    if (obj[k]) return { key: k, node: obj[k] };
  }
  // rekursif ke wrapper umum
  for (const w of ["viewOnceMessage", "viewOnceMessageV2", "ephemeralMessage"]) {
    if (obj[w] && obj[w].message) {
      const r = findMediaNode(obj[w].message);
      if (r) return r;
    }
  }
  return null;
}

/** Unduh media dari pesan yang di-reply (contextInfo.quotedMessage) */
async function getQuotedMedia(sock, m) {
  const ctx =
    (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) ||
    (m.message && m.message.buttonsResponseMessage && m.message.buttonsResponseMessage.contextInfo);
  if (!ctx || !ctx.quotedMessage) return null;
  const found = findMediaNode(ctx.quotedMessage);
  if (!found) return null;
  const typeShort = found.key.replace("Message", "");
  const buf = await sock.downloadMediaMessage({ message: ctx.quotedMessage }, typeShort, { timeout: 60000 });
  return { type: found.key, node: found.node, buffer: buf, quotedMessage: ctx.quotedMessage };
}

module.exports = { getMessageBody, replyText, sendSticker, getQuotedMedia, findMediaNode };

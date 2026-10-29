/**
 * ZerxsBot - Utilitas pesan WhatsApp (helper untuk semua command).
 */
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function sendText(sock, to, text, opts = {}) {
  return sock.sendMessage(to, { text, ...opts });
}

async function sendImage(sock, to, buffer, caption = "", opts = {}) {
  return sock.sendMessage(
    to,
    { image: buffer, caption, ...opts },
    { ephemeralExpiration: opts.viewOnce ? 24 * 3600 : undefined }
  );
}

async function sendVideo(sock, to, buffer, caption = "") {
  return sock.sendMessage(to, { video: buffer, caption, mimetype: "video/mp4" });
}

async function sendSticker(sock, to, buffer) {
  return sock.sendMessage(to, {
    sticker: buffer,
    packname: "ZerxsBot",
    author: "ZerxsDev",
  });
}

async function sendAudio(sock, to, buffer, mimetype = "audio/mpeg", title = "") {
  return sock.sendMessage(to, { audio: buffer, mimetype, title });
}

/** Unduh media pesan (image/video/sticker/document/audio) jadi Buffer. */
async function downloadMedia(msg) {
  const m = msg.message || {};
  const content =
    m.imageMessage ||
    m.videoMessage ||
    m.stickerMessage ||
    m.documentMessage ||
    m.audioMessage;
  if (!content) return null;
  const stream = await downloadContentFromMessage(content, typeOf(msg));
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

function typeOf(msg) {
  const m = msg.message || {};
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.stickerMessage) return "sticker";
  if (m.documentMessage) return "document";
  if (m.audioMessage) return "audio";
  return "document";
}

/** Ambil pesan yang di-reply. */
function quoted(msg) {
  const ctx = msg.message && msg.message.extendedTextMessage;
  return ctx && ctx.contextInfo ? ctx.contextInfo.quotedMessage : null;
}

function isGroup(jid) {
  return /@g\.us$/.test(String(jid || ""));
}

function senderNumber(msg) {
  const jid = msg.key.remoteJid;
  const raw = msg.sender || jid || "";
  return String(raw).split("@")[0].replace(/[^0-9]/g, "");
}

module.exports = {
  sendText,
  sendImage,
  sendVideo,
  sendSticker,
  sendAudio,
  downloadMedia,
  quoted,
  isGroup,
  senderNumber,
};

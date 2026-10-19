// Unduh media pesan (termasuk view-once) ke file lokal
const fs = require('fs');
const { tmp } = require('./maker');

async function downloadMedia(sock, msgOrQuoted) {
  const m = msgOrQuoted?.message;
  if (!m) return null;
  const content = m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage || m.stickerMessage;
  if (!content) return null;
  // untuk view-once: hapus flag ephemeral agar bisa diunduh
  const opts = { read: 'buffer' };
  try {
    const buf = await sock.downloadMediaMessage({ message: m }, 'file', { ...opts });
    const ext = guessExt(content.mimetype);
    const out = tmp(ext);
    fs.writeFileSync(out, buf);
    return { path: out, mimetype: content.mimetype || 'application/octet-stream', caption: content.caption || '' };
  } catch (e) {
    return null;
  }
}

function guessExt(mime = '') {
  if (mime.includes('image')) return 'jpg';
  if (mime.includes('video')) return 'mp4';
  if (mime.includes('audio')) return 'mp3';
  if (mime.includes('pdf')) return 'pdf';
  return 'bin';
}

module.exports = { downloadMedia };

/**
 * ZerxsBot - Pelindung grup: antilink & antitoxic.
 * Dipanggil dari handler untuk pesan grup non-prefiks.
 */
const config = require("../config");
const store = require("./store");
const wa = require("./wa");

const LINK_RE = /(https?:\/\/|www\.|bit\.ly|s\.sh|tinyurl|linktr\.ee|chat\.whatsapp\.com|wa\.me)/i;

function toxicHit(text) {
  const low = String(text).toLowerCase();
  return config.toxicWords.some((w) => new RegExp(`(^|\\W)${w}(\\W|$)`, "i").test(low));
}

/**
 * Cek pesan grup. Return true bila pesan sudah ditangani (dihapus).
 */
async function guardGroup(sock, msg) {
  if (!wa.isGroup(msg.key.remoteJid)) return false;
  const jid = msg.key.remoteJid;
  const s = store.groupSettings(jid);
  const text =
    (msg.message &&
      (msg.message.conversation ||
        (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text))) ||
    "";
  if (!text) return false;
  const senderJid = msg.sender || jid;

  // mute individual oleh bot: hapus pesan user yang sedang di-mute
  const muteUntil = s.mutes[senderJid];
  if (muteUntil && Date.now() < muteUntil) {
    await sock.sendMessage(jid, {
      delete: { remoteJid: jid, fromMe: false, id: msg.key.id, participant: senderJid },
    }).catch(() => {});
    return true;
  } else if (muteUntil) {
    delete s.mutes[senderJid]; // masa mute habis
    store.saveGroupSettings();
  }

  const isAdminMsg = !!(
    msg.message &&
    msg.message.extendedTextMessage &&
    /^\/(antilink|antitoxic|welcome|rules|filter|unfilter|listfilter|showfilter)\b/.test(text)
  );
  if (isAdminMsg) return false;

  if (s.antilink && LINK_RE.test(text)) {
    await sock
      .sendMessage(jid, {
        delete: { remoteJid: jid, fromMe: false, id: msg.key.id, participant: senderJid },
      })
      .catch(() => {});
    s.mutes[senderJid] = Date.now() + 24 * 3600 * 1000; // 1 hari
    store.saveGroupSettings();
    await wa.sendText(
      sock,
      jid,
      `🚫 *Antilink!* Pesan berlink dihapus dan pengirim di-mute 1 hari.\n@${senderJid.split("@")[0]}`,
      { contextInfo: { mentionedJid: [senderJid] } }
    ).catch(() => {});
    return true;
  }

  if (s.antitoxic && toxicHit(text)) {
    await sock
      .sendMessage(jid, {
        delete: { remoteJid: jid, fromMe: false, id: msg.key.id, participant: senderJid },
      })
      .catch(() => {});
    s.mutes[senderJid] = Date.now() + 24 * 3600 * 1000;
    store.saveGroupSettings();
    await wa.sendText(
      sock,
      jid,
      `🛡️ *Antitoxic!* Kata kasar dihapus dan pengirim di-mute 1 hari.\n@${senderJid.split("@")[0]}`,
      { contextInfo: { mentionedJid: [senderJid] } }
    ).catch(() => {});
    return true;
  }

  // Filter: jika ada kata filter terkirim, tampilkan isi filternya
  const key = text.trim().toLowerCase();
  if (s.filters[key]) {
    await wa.sendText(sock, jid, `🔎 *Filter [${key}]:*\n\n${s.filters[key]}`);
    return true;
  }
  return false;
}

module.exports = guardGroup;

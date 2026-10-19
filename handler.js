// Handler pesan ZerxsBot - dispatch perintah per-file di ./commands, anti-toxic, antilink, welcome, filter, mode CS
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { api } = require('./lib/sheetdb');
const state = require('./lib/state');
const cs = require('./lib/cs');

const CMD_DIR = path.join(__dirname, 'commands');
const commands = {};
for (const f of fs.readdirSync(CMD_DIR).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(CMD_DIR, f));
  if (cmd && cmd.name) commands[cmd.name] = cmd;
}

// Simpan status grup (antilink/antitoxic/welcome/mute/filter) in-memory + fallback file
const groupData = new Map();
function getGroup(jid) {
  if (!groupData.has(jid)) groupData.set(jid, { antilink: false, antitoxic: false, welcome: false, mutes: {}, filters: [] });
  return groupData.get(jid);
}

const TOXIC_WORDS = ['anjing','babi','tolol','bodoh','goblok','bangsat','kontol','memek','jancok','asw','ngentot','brengsek','setan','iblis'];

// Ambil data user spreadsheet berdasarkan nomor hp
async function findUserByPhone(sock, phone) {
  const r = await api('getUserByPhone', { phone });
  if (r.ok && r.user) return r.user;
  return null;
}

function register(sock, botNumber, entry) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) {
      try { await onMessage(sock, botNumber, entry, m); }
      catch (e) { console.error('[handler]', e.message); }
    }
  });

  // Welcome untuk member baru
  sock.ev.on('group-participants.update', async (u) => {
    try {
      const g = getGroup(u.id);
      if (!g.welcome) return;
      for (const p of u.participants) {
        const text = u.action === 'add'
          ? `👋 Selamat datang @${p.split('@')[0]} di grup ini!\nSilakan baca /rules.`
          : `☺️ Sampai jumpa @${p.split('@')[0]}...`;
        await sock.sendMessage(u.id, { text, mentions: [p] });
      }
    } catch (e) {}
  });
}

async function sendWarnReply(sock, chatId, msg, text) {
  await sock.sendMessage(chatId, { text, ...((msg.key && !msg.key.fromMe) ? { quoted: msg } : {}) });
}

async function onMessage(sock, botNumber, entry, msg) {
  if (!msg || msg.key.fromMe) return;
  const chatId = msg.key.remoteJid;
  if (!chatId) return;
  const isGroup = chatId.endsWith('@g.us');
  const senderRaw = msg.key.participant || chatId;
  const sender = senderRaw.split('@')[0];

  const ctx = {
    sock, botNumber, entry, msg, chatId, isGroup, sender,
    body: getBody(msg),
    mime: msg.message?.imageMessage?.mimetype || msg.message?.videoMessage?.mimetype || '',
    isMedia: !!(msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage || msg.message?.stickerMessage),
    quoted: msg.message?.extendedTextMessage?.quoted || null,
    args: [], prefix: '', commandName: '',
  };

  // ===== MODE CS (botType === 'cs') : tanpa prefix, jawab dengan AI GPT-4o-mini =====
  if (entry.meta && String(entry.meta.botType).toLowerCase() === 'cs') {
    if (!isGroup) {
      await cs.handleCS(sock, entry.meta, chatId, sender, ctx.body || extractAnyText(msg));
    }
    return;
  }

  // ===== Grup: cek mute =====
  if (isGroup) {
    const g = getGroup(chatId);
    if (g.mutes[senderRaw] && Date.now() < g.mutes[senderRaw]) {
      return; // dibungkam
    }
    // antilink
    const link = /(https?:\/\/|wa\.me|bit\.ly|tinyurl)/i.exec(ctx.body || '');
    if (g.antilink && link && !isAdminMsg(sock, msg)) {
      await deleteMsg(sock, chatId, msg.key, senderRaw);
      g.mutes[senderRaw] = Date.now() + 24 * 3600 * 1000; // 1 hari
      await sock.sendMessage(chatId, { text: `⛔ Link terdeteksi. Pesan dihapus & @${sender} di-mute 1 hari.`, mentions: [senderRaw] });
      return;
    }
    // antitoxic
    if (g.antitoxic) {
      const bad = TOXIC_WORDS.find(w => new RegExp('\\b' + w + '\\b', 'i').test(ctx.body || ''));
      if (bad && !isAdminMsg(sock, msg)) {
        await deleteMsg(sock, chatId, msg.key, senderRaw);
        g.mutes[senderRaw] = Date.now() + 24 * 3600 * 1000;
        await sock.sendMessage(chatId, { text: `⛔ Kata kasar terdeteksi ("${bad}"). Pesan dihapus & @${sender} di-mute 1 hari.`, mentions: [senderRaw] });
        return;
      }
    }
    // filter: kata yang difilter otomatis dikirim ulang sebagai konten filter
    for (const f of g.filters) {
      if (f.keys.some(k => new RegExp('\\b' + k + '\\b', 'i').test(ctx.body || ''))) {
        await sock.sendMessage(chatId, { text: `📌 [FILTER: ${f.name}]\n${f.content}` });
      }
    }
  }

  // ===== Deteksi prefix sesuai role =====
  let user = await findUserByPhone(sock, sender);
  // Jika nomor pengirim == nomor bot terdaftar di spreadsheet users, tetap dianggap valid (sesuai permintaan)
  const role = user ? user.role : (sender === botNumber ? 'developer' : 'member');
  ctx.user = user; ctx.role = role;
  const prefixes = state.prefixesForRole(role);

  const body = (ctx.body || '').trim();
  const usedPrefix = prefixes.find(p => body.startsWith(p));
  if (!usedPrefix) {
    // bukan perintah: di personal chat beri peringatan singkat hanya jika ada teks
    if (body && !isGroup) {
      await sendWarnReply(sock, chatId, msg, `Perintah tidak dikenali. Gunakan awalan "${prefixes[0]}" lalu ketik ${prefixes[0]}menu untuk melihat daftar perintah.`);
    }
    return;
  }

  const content = body.slice(usedPrefix.length).trim();
  const parts = content.split(/\s+/);
  const cmdName = (parts[0] || '').toLowerCase();
  ctx.args = parts.slice(1);
  ctx.prefix = usedPrefix;
  ctx.commandName = cmdName;

  const cmd = commands[cmdName];
  if (!cmd) {
    await sendWarnReply(sock, chatId, msg, `❌ Salah perintah / perintah "${usedPrefix}${cmdName}" tidak ditemukan.\nKetik ${usedPrefix}menu untuk melihat daftar perintah.`);
    return;
  }

  // izin role utk perintah personal
  if (!isGroup && !state.canUseCommand(role, cmdName)) {
    await sendWarnReply(sock, chatId, msg, `⛔ Role *${role}* tidak punya akses ke ${usedPrefix}${cmdName}. Upgrade akses: ${config.telegram.url}`);
    return;
  }
  // perintah grup khusus developer
  if (isGroup && cmd.groupOnly !== true && cmd.name !== 'menu' && cmd.name !== 'info' && cmd.name !== 'tutor') {
    // perintah personal di grup: izinkan bila role mengizinkan
    if (!state.canUseCommand(role, cmdName)) {
      await sendWarnReply(sock, chatId, msg, `⛔ Role *${role}* tidak punya akses ke ${usedPrefix}${cmdName}.`);
      return;
    }
  }
  if (cmd.groupOnly && !isGroup) {
    await sendWarnReply(sock, chatId, msg, `ℹ️ Perintah ${usedPrefix}${cmdName} hanya bisa dipakai di dalam grup.`);
    return;
  }
  if (cmd.groupOnly && !state.isGroupCommandAllowed(role)) {
    await sendWarnReply(sock, chatId, msg, `⛔ Perintah grup khusus untuk role Developer.`);
    return;
  }

  // kwota harian (kecuali menu/info/tutor agar tidak terkunci total)
  if (!['menu', 'info', 'tutor'].includes(cmdName)) {
    const q = state.useQuota(sender, role);
    if (!q.allowed) {
      await sendWarnReply(sock, chatId, msg, `🚫 *LIMIT HABIS.*\nKuota harian role ${role} (${q.quota}x chat) sudah terpakai semua.\nLimit akan direset besok jam 00.00.`);
      return;
    }
  }

  try {
    await cmd.exec(ctx);
  } catch (e) {
    await sock.sendMessage(chatId, { text: '⚠️ Terjadi kesalahan: ' + e.message });
  }
}

function getBody(msg) {
  const m = msg.message || {};
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
}
function extractAnyText(msg) { return getBody(msg); }

function isAdminMsg(sock, msg) {
  try {
    const participant = msg.key.participant || '';
    const group = sock.groupMetadata && sock.groupMetadata.cache?.get?.(msg.key.remoteJid);
    if (group) {
      const p = group.participants.find(x => x.id === participant);
      return p && (p.admin || msg.key.remoteJid.split('@')[0] === participant.split('@')[0]);
    }
  } catch (e) {}
  return false;
}

async function deleteMsg(sock, chatId, key, participant) {
  try { await sock.sendMessage(chatId, { delete: key }); } catch (e) {}
}

module.exports = { register, commands, getGroup, findUserByPhone, getUserByPhone };
